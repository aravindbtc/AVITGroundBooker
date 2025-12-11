
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Razorpay = require('razorpay');
const crypto = require('crypto');

admin.initializeApp();
const db = admin.firestore();

// Ensure you have set these in your Firebase environment configuration
// firebase functions:config:set razorpay.key_id="YOUR_KEY_ID" razorpay.key_secret="YOUR_KEY_SECRET" razorpay.webhook_secret="YOUR_WEBHOOK_SECRET"
const razorpay = new Razorpay({
  key_id: functions.config().razorpay.key_id,
  key_secret: functions.config().razorpay.key_secret
});

// Helper: generate booking doc id
function bookingDocId() {
  return db.collection('bookings').doc().id;
}

// Create Razorpay order endpoint
exports.createRazorpayOrder = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Sign in required');

  const { uid } = context.auth;
  const { slots, addons } = data;
  if (!Array.isArray(slots) || slots.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'No slots selected');
  }
  
  const venueDoc = await db.doc('venue/avit-ground').get();
  if (!venueDoc.exists || typeof venueDoc.data()?.basePrice !== 'number') {
      throw new functions.https.HttpsError('failed-precondition', 'Venue details, including base price, must be configured by an admin before bookings can be made.');
  }
  const venueData = venueDoc.data()!;
  const basePrice = venueData.basePrice;
  const peakSurcharge = 150;


  // Generate bookingId
  const bookingId = bookingDocId();
  const bookingRef = db.collection('bookings').doc(bookingId);

  // Server-side calculation of total amount
  let calculatedTotal = 0;

  // Transaction: verify all slots are still available and create a pending booking
  try {
    await db.runTransaction(async (t) => {
      const slotRefsAndData = [];
      let slotPriceTotal = 0;

      for (const slotId of slots) {
        const slotRef = db.collection('slots').doc(slotId);
        const slotSnap = await t.get(slotRef);
        if (slotSnap.exists && slotSnap.data()?.status !== 'available') {
          throw new functions.https.HttpsError('failed-precondition', `A selected time slot (${slotId}) is no longer available.`);
        }
        
        const [dateString, hour] = slotId.split('_');
        const h = parseInt(hour, 10);
        const isPeak = (h >= 17 && h <= 20);
        const price = basePrice + (isPeak ? peakSurcharge : 0);
        slotPriceTotal += price;

        const date = new Date(dateString);
        const startAt = new Date(date); startAt.setUTCHours(h,0,0,0);
        const endAt = new Date(date); endAt.setUTCHours(h+1,0,0,0);
        
        slotRefsAndData.push({ 
            ref: slotRef, 
            snap: slotSnap,
            data: {
                groundId: 'avit-ground',
                dateString: dateString,
                startTime: `${String(h).padStart(2,'0')}:00`,
                endTime: `${String(h+1).padStart(2,'0')}:00`,
                startAt: startAt,
                endAt: endAt,
                price: price,
                isPeak,
                status: 'blocked',
                bookingId: bookingId
            }
        });
      }

      // Calculate addon prices
      let addonPriceTotal = 0;
      if (addons && addons.length > 0) {
        for (const addon of addons) {
            const addonRef = db.collection('accessories').doc(addon.id);
            const addonSnap = await t.get(addonRef);
            if (!addonSnap.exists) {
                throw new functions.https.HttpsError('not-found', `Addon with ID ${addon.id} not found.`);
            }
            const addonData = addonSnap.data();
            if (addonData.stock < addon.quantity) {
                 throw new functions.https.HttpsError('failed-precondition', `Not enough stock for ${addon.name}.`);
            }
            addonPriceTotal += addonData.price * addon.quantity;
        }
      }
      
      calculatedTotal = slotPriceTotal + addonPriceTotal;

      // Create booking doc with status pending
      const bookingData = {
        uid,
        groundId: 'avit-ground',
        date: slots[0].split('_')[0],
        slots,
        addons: addons || [],
        totalAmount: calculatedTotal,
        status: 'pending',
        payment: { orderId: null, status: 'pending', createdAt: admin.firestore.FieldValue.serverTimestamp() },
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      t.set(bookingRef, bookingData);
      
      // Mark slots as blocked (or create them if they don't exist)
      for (const { ref, snap, data } of slotRefsAndData) {
          if (snap.exists) {
            t.update(ref, { status: 'blocked', bookingId: bookingId });
          } else {
            t.set(ref, data);
          }
      }
    });
  } catch (error) {
     console.error("Transaction for booking creation failed:", error);
     if (error instanceof functions.https.HttpsError) {
        throw error;
     }
     throw new functions.https.HttpsError('internal', 'Could not reserve slots. Please try again.');
  }

  // Create Razorpay order
  const amountInPaise = Math.round(calculatedTotal * 100);
  const orderOptions = {
    amount: amountInPaise,
    currency: "INR",
    receipt: bookingId
  };

  const order = await razorpay.orders.create(orderOptions);

  // Update booking with order id
  await db.collection('bookings').doc(bookingId).update({
    'payment.orderId': order.id,
    'payment.status': 'created',
  });

  return { orderId: order.id, bookingId, amount: amountInPaise, key: functions.config().razorpay.key_id };
});

// Webhook to be set in Razorpay dashboard
exports.razorpayWebhook = functions.https.onRequest(async (req, res) => {
  const secret = functions.config().razorpay.webhook_secret;
  const signature = req.headers['x-razorpay-signature'];
  const body = JSON.stringify(req.body);

  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  if (expected !== signature) {
    console.warn("Invalid Razorpay webhook signature received.");
    return res.status(400).send('Invalid signature');
  }

  const payload = req.body;

  if (payload.event === 'payment.captured' || payload.event === 'order.paid') {
    const payment = payload.payload.payment.entity;
    const razorpayOrderId = payment.order_id;
    
    const bookingsQuery = await db.collection('bookings').where('payment.orderId', '==', razorpayOrderId).limit(1).get();
    if (bookingsQuery.empty) {
      console.error('Booking not found for order', razorpayOrderId);
      return res.status(200).send('ok');
    }
    
    const bookingSnap = bookingsQuery.docs[0];
    const bookingId = bookingSnap.id;
    const booking = bookingSnap.data();

    // Idempotency check: if booking is already paid, do nothing.
    if (booking.status === 'paid') {
        console.log(`Booking ${bookingId} already marked as paid. Ignoring webhook.`);
        return res.status(200).send('ok');
    }

    const batch = db.batch();
    const bookingRef = db.collection('bookings').doc(bookingId);
    batch.update(bookingRef, {
      status: 'paid',
      'payment.razorpayPaymentId': payment.id,
      'payment.status': 'paid',
      'payment.capturedAt': admin.firestore.FieldValue.serverTimestamp()
    });

    for (const slotId of booking.slots) {
      const slotRef = db.collection('slots').doc(slotId);
      batch.update(slotRef, { status: 'booked', bookingId });
    }

    for (const addon of booking.addons || []) {
      const accRef = db.collection('accessories').doc(addon.id);
      batch.update(accRef, { stock: admin.firestore.FieldValue.increment(-1 * (addon.quantity || 1)) });
    }
    
    const points = Math.floor((booking.totalAmount || 0) / 100);
    if(points > 0) {
        const userRef = db.collection('users').doc(booking.uid);
        batch.update(userRef, { loyaltyPoints: admin.firestore.FieldValue.increment(points) });
    }

    await batch.commit();
    console.log(`Successfully processed payment for booking ${bookingId}`);

  } else if (payload.event === 'payment.failed') {
      const payment = payload.payload.payment.entity;
      const razorpayOrderId = payment.order_id;
      const bookingsQuery = await db.collection('bookings').where('payment.orderId', '==', razorpayOrderId).limit(1).get();
      if (bookingsQuery.empty) {
        return res.status(200).send('ok');
      }
      const bookingSnap = bookingsQuery.docs[0];
      const bookingId = bookingSnap.id;
      const booking = bookingSnap.data();

      // Release the slots: Since they were created on the fly if they didn't exist,
      // we can just delete them. If they are updated to 'available', they'll just be empty docs.
      const batch = db.batch();
      const bookingRef = db.collection('bookings').doc(bookingId);
      batch.update(bookingRef, { status: 'failed', 'payment.status': 'failed' });

      for (const slotId of booking.slots) {
        const slotRef = db.collection('slots').doc(slotId);
        // This makes them available again for the dynamic checker
        batch.delete(slotRef);
      }
      
      await batch.commit();

      console.log(`Payment failed for booking ${bookingId}. Slots released.`);
  }

  res.status(200).send('ok');
});
