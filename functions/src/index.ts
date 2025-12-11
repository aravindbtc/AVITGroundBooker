
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Razorpay from 'razorpay';
import crypto = require('crypto');

admin.initializeApp();
const db = admin.firestore();
const razorpay = new Razorpay({
  key_id: functions.config().razorpay.key_id,
  key_secret: functions.config().razorpay.key_secret,
});

// REWRITTEN: Direct booking and payment model. No more proposals.
export const createRazorpayOrder = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated to book a slot.');
  }
  const { slots, addons } = data; // slots: array<{startAt: string, endAt: string, durationMins: number, price: number}>

  if (!slots || !Array.isArray(slots) || slots.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Slot information is required.');
  }

  // Fetch venue for base price - ensures server-side price validation
  const venueDoc = await db.doc('venue/avit-ground').get();
  if (!venueDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Venue details not configured. Please contact admin.');
  }
  const basePrice = venueDoc.data()?.basePrice || 500;

  return await db.runTransaction(async (transaction) => {
    const slotRefs: admin.firestore.DocumentReference[] = [];
    let calculatedTotal = 0;

    for (const slot of slots) {
      const proposedStart = new Date(slot.startAt);
      const proposedEnd = new Date(slot.endAt);
      const dateString = proposedStart.toISOString().split('T')[0];

      // Security check for overlaps
      const overlapQuery = db.collection('slots')
        .where('dateString', '==', dateString);
      
      const overlapsSnap = await transaction.get(overlapQuery);
      
      const hasOverlap = overlapsSnap.docs.some(doc => {
          const s = doc.data();
          const existingStart = s.startAt.toDate();
          const existingEnd = s.endAt.toDate();
          // Check if !(existingEnd <= proposedStart || existingStart >= proposedEnd)
          return existingEnd > proposedStart && existingStart < proposedEnd;
      });

      if (hasOverlap) {
        throw new functions.https.HttpsError('already-exists', 'The selected time slot overlaps with an existing booking. Please choose a different time.');
      }

      // Server-side price calculation
      const durationHours = slot.durationMins / 60;
      const isPeak = proposedStart.getHours() >= 17; // 5 PM onwards
      const slotPrice = isPeak ? (basePrice * 1.2) * durationHours : basePrice * durationHours;
      calculatedTotal += slotPrice;

      // Prepare to create new slot document
      const newSlotRef = db.collection('slots').doc();
      transaction.set(newSlotRef, {
        groundId: 'avit-ground',
        dateString: dateString,
        startTime: proposedStart.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit'}),
        endTime: proposedEnd.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit'}),
        startAt: admin.firestore.Timestamp.fromDate(proposedStart),
        endAt: admin.firestore.Timestamp.fromDate(proposedEnd),
        price: slotPrice,
        isPeak: isPeak,
        status: 'blocked', // Block temporarily until payment
        bookingId: null,
      });
      slotRefs.push(newSlotRef);
    }
    
    // Calculate addons price if any
    for (const addon of addons || []) {
        calculatedTotal += addon.price * addon.quantity;
    }

    // Create Razorpay order with server-calculated total
    const order = await razorpay.orders.create({
      amount: calculatedTotal * 100, // To paise
      currency: 'INR',
      receipt: `booking_${context.auth.uid}_${Date.now()}`,
      notes: { userUID: context.auth.uid },
    });

    // Create the booking document
    const bookingRef = db.collection('bookings').doc();
    transaction.set(bookingRef, {
      uid: context.auth.uid,
      groundId: 'avit-ground',
      date: slots[0].startAt.split('T')[0],
      slots: slotRefs.map(ref => ref.id),
      addons: addons || [],
      totalAmount: calculatedTotal,
      payment: {
        orderId: order.id,
        status: 'created',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      status: 'pending', // Booking status is pending until payment is complete
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    // Pass back slot IDs and booking ID to webhook/client
    const newSlotIds = slotRefs.map(ref => ref.id);
    transaction.update(bookingRef, { 'payment.notes': { slotIds: newSlotIds, bookingId: bookingRef.id } });

    return { orderId: order.id, bookingId: bookingRef.id };
  });
});


// Webhook to be set in Razorpay dashboard
export const razorpayWebhook = functions.https.onRequest(async (req, res) => {
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
      batch.update(slotRef, { status: 'booked', bookingId: bookingId });
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

      const batch = db.batch();
      const bookingRef = db.collection('bookings').doc(bookingId);
      batch.update(bookingRef, { status: 'failed', 'payment.status': 'failed' });

      // Instead of making slots available, delete the transient slot documents
      for (const slotId of booking.slots) {
        const slotRef = db.collection('slots').doc(slotId);
        batch.delete(slotRef);
      }
      
      await batch.commit();
      console.log(`Payment failed for booking ${bookingId}. Transient slots deleted.`);
  }

  res.status(200).send('ok');
});

    