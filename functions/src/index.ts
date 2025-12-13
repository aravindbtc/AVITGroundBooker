
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Razorpay from 'razorpay';
import crypto = require('crypto');

admin.initializeApp();
const db = admin.firestore();

// This function now directly books the slot and marks it as paid.
// The Razorpay integration is bypassed for development.
export const createRazorpayOrder = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated to book a slot.');
  }
  const { slots, addons } = data; // slots: array of objects with startAt, endAt as ISO strings.

  if (!slots || !Array.isArray(slots) || slots.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Slot information is required.');
  }

  // Fetch venue for server-side price validation
  const venueDoc = await db.doc('venue/avit-ground').get();
  const venueData = venueDoc.data();
  if (!venueDoc.exists || !venueData) {
      throw new functions.https.HttpsError('not-found', 'Venue details not configured. Please contact admin.');
  }

  return await db.runTransaction(async (transaction) => {
    const slotRefs: admin.firestore.DocumentReference[] = [];
    let calculatedTotal = 0;
    
    // Use the date from the first proposed slot for the query
    const bookingDateString = new Date(slots[0].startAt).toISOString().split('T')[0];

    // Query for any slots on the same day to check for overlaps
    const overlapQuery = db.collection('slots').where('dateString', '==', bookingDateString);
    const existingSlotsSnap = await transaction.get(overlapQuery);
    
    for (const proposedSlot of slots) {
      const proposedStart = new Date(proposedSlot.startAt);
      const proposedEnd = new Date(proposedSlot.endAt);
    
      const hasOverlap = existingSlotsSnap.docs.some(doc => {
          const s = doc.data();
          // Convert Firestore Timestamps from existing documents to JS Dates for comparison
          const existingStart = s.startAt.toDate();
          const existingEnd = s.endAt.toDate();
          // Overlap condition: (StartA < EndB) and (EndA > StartB)
          return proposedStart < existingEnd && proposedEnd > existingStart;
      });

      if (hasOverlap) {
        throw new functions.https.HttpsError('already-exists', 'The selected time slot overlaps with an existing booking. Please choose a different time.');
      }
    }


    // If no overlaps are found, proceed to create the new slots and the booking
    for (const slot of slots) {
      const proposedStart = new Date(slot.startAt);
      const proposedEnd = new Date(slot.endAt);
      const dateString = proposedStart.toISOString().split('T')[0];

      if (isNaN(proposedStart.getTime()) || isNaN(proposedEnd.getTime())) {
          throw new functions.https.HttpsError('invalid-argument', 'Invalid date format provided for a slot.');
      }
      
      const slotPrice = slot.price; 
      calculatedTotal += slotPrice;
      
      const newSlotRef = db.collection('slots').doc();
      transaction.set(newSlotRef, {
        groundId: 'avit-ground',
        dateString: dateString,
        startTime: proposedStart.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit'}),
        endTime: proposedEnd.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit'}),
        startAt: admin.firestore.Timestamp.fromDate(proposedStart),
        endAt: admin.firestore.Timestamp.fromDate(proposedEnd),
        price: slotPrice,
        isPeak: proposedStart.getHours() >= 18,
        status: 'booked', // Mark as booked directly
        bookingId: null, // Will be updated with the booking ID below
      });
      slotRefs.push(newSlotRef);
    }
    
    // Calculate total including addons
    for (const addon of addons || []) {
        calculatedTotal += addon.price * addon.quantity;
    }

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
        orderId: `dev-booking-${bookingRef.id}`, // Mock order ID for dev
        status: 'paid', // Mark as paid directly
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      status: 'paid', // Mark booking as paid directly
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    // Update the newly created slots with the booking ID
    for (const slotRef of slotRefs) {
        transaction.update(slotRef, { bookingId: bookingRef.id });
    }

    // Decrement stock for any selected addons
    for (const addon of addons || []) {
      const accRef = db.collection('accessories').doc(addon.id);
      transaction.update(accRef, { stock: admin.firestore.FieldValue.increment(-1 * (addon.quantity || 1)) });
    }
    
    // Add loyalty points to the user
    const points = Math.floor(calculatedTotal / 100);
    if(points > 0) {
        const userRef = db.collection('users').doc(context.auth.uid);
        transaction.update(userRef, { loyaltyPoints: admin.firestore.FieldValue.increment(points) });
    }
    
    // Return success and the new booking ID
    return { success: true, bookingId: bookingRef.id };
  });
});


// Webhook is not used in the dev flow but kept for future integration.
export const razorpayWebhook = functions.https.onRequest(async (req, res) => {
  const secret = functions.config().razorpay.webhook_secret;
  const signature = req.headers['x-razorpay-signature'];
  
  if (!secret || !signature) {
    console.warn("Razorpay webhook secret or signature is missing.");
    return res.status(400).send('Configuration error.');
  }

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
