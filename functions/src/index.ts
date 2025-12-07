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

  const uid = context.auth.uid;
  const { slots, addons, totalAmount } = data;
  if (!Array.isArray(slots) || slots.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'No slots selected');
  }

  // Generate bookingId
  const bookingId = bookingDocId();
  const bookingRef = db.collection('bookings').doc(bookingId);

  // Transaction: verify all slots are still available and create a pending booking
  await db.runTransaction(async (t) => {
    for (const slotId of slots) {
      const slotRef = db.collection('slots').doc(slotId);
      const slotSnap = await t.get(slotRef);
      if (!slotSnap.exists) throw new functions.https.HttpsError('not-found', `Slot ${slotId} not found`);
      const slot = slotSnap.data();
      if (slot.status !== 'available') {
        throw new functions.https.HttpsError('failed-precondition', `Slot ${slotId} is not available`);
      }
    }

    // Create booking doc with status pending
    const bookingData = {
      uid,
      groundId: 'avit-ground',
      date: slots[0].split('_')[0],
      slots,
      addons: addons || [],
      totalAmount,
      status: 'pending',
      payment: { orderId: null, status: 'pending', createdAt: admin.firestore.FieldValue.serverTimestamp() },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    t.set(bookingRef, bookingData);
    
    // Mark slots as pending
    for (const slotId of slots) {
        const slotRef = db.collection('slots').doc(slotId);
        t.update(slotRef, { status: 'blocked', bookingId: bookingId });
    }
  });

  // Create Razorpay order
  const amountInPaise = Math.round(totalAmount * 100);
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
      batch.update(accRef, { stock: admin.firestore.FieldValue.increment(-1 * (addon.qty || 1)) });
    }
    
    const points = Math.floor((booking.totalAmount || 0) / 100);
    if(points > 0) {
        const userRef = db.collection('users').doc(booking.uid);
        batch.update(userRef, { loyaltyPoints: admin.firestore.FieldValue.increment(points) });
    }

    await batch.commit();

  } else if (payload.event === 'payment.failed') {
      const payment = payload.payload.payment.entity;
      const razorpayOrderId = payment.order_id;
      const bookingsQuery = await db.collection('bookings').where('payment.orderId', '==', razorpayOrderId).limit(1).get();
      if (bookingsQuery.empty) {
        return res.status(200).send('ok');
      }
      const bookingSnap = bookingsQuery.docs[0];
      const booking = bookingSnap.data();

      // Set booking to failed and release the slots
      await db.runTransaction(async (t) => {
          const bookingRef = db.collection('bookings').doc(bookingSnap.id);
          t.update(bookingRef, { status: 'failed', 'payment.status': 'failed' });
          for (const slotId of booking.slots) {
            const slotRef = db.collection('slots').doc(slotId);
            t.update(slotRef, { status: 'available', bookingId: null });
          }
      });
  }

  res.status(200).send('ok');
});


exports.generateSlots = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated','Sign in');
  const uid = context.auth.uid;
  const userSnap = await db.collection('users').doc(uid).get();
  if (!userSnap.exists || userSnap.data().role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied','Only admin can perform this action.');
  }

  const days = data.days || 30;
  const startHour = 5; // 5 AM
  const endHour = 22; // 10 PM
  const venueDoc = await db.doc('venue/avit-ground').get();
  const basePrice = venueDoc.data().basePricePerHour || 500;
  const peakSurcharge = 150;

  const batch = db.batch();
  const now = new Date();
  for (let d=0; d<days; d++) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d);
    const yyyy = date.toISOString().slice(0,10);
    for (let h=startHour; h<endHour; h++) {
      const slotId = `${yyyy}_${String(h).padStart(2,'0')}`;
      const startAt = new Date(date); startAt.setHours(h,0,0,0);
      const endAt = new Date(date); endAt.setHours(h+1,0,0,0);
      const slotRef = db.collection('slots').doc(slotId);
      const isPeak = (h >= 17 && h <= 20);

      batch.set(slotRef, {
        groundId: 'avit-ground',
        date: yyyy,
        time: `${String(h).padStart(2,'0')}:00`,
        startAt: admin.firestore.Timestamp.fromDate(startAt),
        endAt: admin.firestore.Timestamp.fromDate(endAt),
        price: basePrice + (isPeak ? peakSurcharge : 0),
        isPeak,
        status: 'available',
        bookingId: null
      }, { merge: true });
    }
  }
  await batch.commit();
  return { success: true, message: `Generated slots for ${days} days.` };
});
