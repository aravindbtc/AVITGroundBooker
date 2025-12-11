
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

// NEW: Handle custom proposals with overlap check
export const createRazorpayOrder = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated.');
  }
  const { slots, addons, totalAmount } = data; // slots: array<{id?: string, start: Timestamp, end: Timestamp, durationMins: number}>

  return await db.runTransaction(async (transaction) => {
    const slotRefs: admin.firestore.DocumentReference[] = [];
    let pendingSlots: any[] = []; // For new proposals

    // Validate/lock existing slots
    for (const slot of slots) {
      if (slot.id) { // Existing slot
        const slotRef = db.collection('venues/cricket/slots').doc(slot.id);
        const slotSnap = await transaction.get(slotRef);
        if (!slotSnap.exists || slotSnap.data()?.status !== 'available') {
          throw new functions.https.HttpsError('invalid-argument', `Slot ${slot.id} unavailable.`);
        }
        transaction.update(slotRef, { status: 'booked', bookedBy: context.auth.uid });
        slotRefs.push(slotRef);
      } else { // New custom proposal
        // Check overlaps on date/time
        const date = new Date(slot.startAt).toISOString().split('T')[0];
        const overlapQuery = db.collection('venues/cricket/slots')
          .where('date', '==', date)
          .where('status', '!=', 'maintenance');
        const overlaps = await transaction.get(overlapQuery);
        const proposedStart = new Date(slot.startAt);
        const proposedEnd = new Date(slot.endAt);
        if (overlaps.docs.some(doc => {
          const s = doc.data();
          const existingStart = s.startAt.toDate();
          const existingEnd = s.endAt.toDate();
          return !(existingEnd <= proposedStart || existingStart >= proposedEnd);
        })) {
          throw new functions.https.HttpsError('invalid-argument', 'Proposed slot overlaps existing—adjust times.');
        }
        // Create pending slot
        const newSlotRef = db.collection('venues/cricket/slots').doc();
        const price = calculatePrice(proposedStart.getHours(), slot.durationMins); // e.g., (duration/60 * 500) + peak
        transaction.set(newSlotRef, {
          ...slot,
          status: 'pending',
          proposerUID: context.auth.uid,
          price,
          date: admin.firestore.Timestamp.fromDate(proposedStart),
        });
        pendingSlots.push({ id: newSlotRef.id, ...slot });
        slotRefs.push(newSlotRef);
      }
    }

    // Create Razorpay order (only if all valid; for pending, charge deposit or full?)
    const order = await razorpay.orders.create({
      amount: totalAmount * 100, // Paise
      currency: 'INR',
      receipt: `booking_${Date.now()}`,
      notes: { userUID: context.auth.uid, slots: slots.map((s: any) => s.id || 'new') },
    });

    // Create pending booking
    const bookingRef = db.collection('bookings').doc();
    transaction.set(bookingRef, {
      userUID: context.auth.uid,
      slots: slotRefs.map(ref => ref.path),
      addons,
      totalAmount,
      status: pendingSlots.length > 0 ? 'pending_approval' : 'pending',
      razorpayOrderID: order.id,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // TODO: Decrement add-on stock if applicable

    return { orderId: order.id, bookingId: bookingRef.id, pendingSlots };
  });
});

// NEW: Admin approval
export const approveSlot = functions.https.onCall(async (data, context) => {
  if (context.auth?.token.email !== 'admin@avit.ac.in') {
    throw new functions.https.HttpsError('permission-denied', 'Admin only.');
  }
  const { slotId, action } = data; // action: 'approve' | 'reject'
  const slotRef = db.collection('venues/cricket/slots').doc(slotId);
  const slotSnap = await slotRef.get();
  if (!slotSnap.exists || slotSnap.data()?.status !== 'pending') {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid slot.');
  }
  await slotRef.update({
    status: action === 'approve' ? 'available' : 'rejected',
    approverUID: context.auth.uid,
    approvedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  // FCM notify proposer
  const proposerUID = slotSnap.data()?.proposerUID;
  if (proposerUID) {
    // await admin.messaging().sendToDevice(...); // Implement FCM
  }
  return { success: true };
});

function calculatePrice(hour: number, durationMins: number): number {
  const base = (durationMins / 60) * 500;
  return hour > 17 ? base * 1.2 : base; // Peak after 5PM
}


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
    
    const bookingsQuery = await db.collection('bookings').where('razorpayOrderID', '==', razorpayOrderId).limit(1).get();
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

    for (const slotPath of booking.slots) {
      const slotRef = db.doc(slotPath);
      batch.update(slotRef, { status: 'booked' });
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
      const bookingsQuery = await db.collection('bookings').where('razorpayOrderID', '==', razorpayOrderId).limit(1).get();
      if (bookingsQuery.empty) {
        return res.status(200).send('ok');
      }
      const bookingSnap = bookingsQuery.docs[0];
      const bookingId = bookingSnap.id;
      const booking = bookingSnap.data();

      const batch = db.batch();
      const bookingRef = db.collection('bookings').doc(bookingId);
      batch.update(bookingRef, { status: 'failed', 'payment.status': 'failed' });

      for (const slotPath of booking.slots) {
        const slotRef = db.doc(slotPath);
        // This makes them available again for the dynamic checker
        batch.update(slotRef, { status: 'available' });
      }
      
      await batch.commit();

      console.log(`Payment failed for booking ${bookingId}. Slots released.`);
  }

  res.status(200).send('ok');
});

    