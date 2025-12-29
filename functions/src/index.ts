import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Razorpay from 'razorpay';
import crypto = require('crypto');

admin.initializeApp();
const db = admin.firestore();

// Make sure to set these in your Firebase environment config
// firebase functions:config:set razorpay.key_id="YOUR_KEY_ID" razorpay.key_secret="YOUR_KEY_SECRET"
const razorpay = new Razorpay({
    key_id: functions.config().razorpay.key_id,
    key_secret: functions.config().razorpay.key_secret,
});


/**
 * Creates a pending booking and a Razorpay order. Does NOT confirm the booking.
 */
export const createRazorpayOrder = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated to book a slot.');
    }
    const { slots, addons = [], totalAmount } = data;

    if (!slots || !Array.isArray(slots) || slots.length === 0) {
        throw new functions.https.HttpsError('invalid-argument', 'Slot information is required.');
    }
    if (!totalAmount || typeof totalAmount !== 'number' || totalAmount <= 0) {
         throw new functions.https.HttpsError('invalid-argument', 'A valid total amount is required.');
    }

    const bookingDateString = new Date(slots[0].startAt).toISOString().split('T')[0];

    // Create a temporary booking document to hold the details
    const bookingRef = db.collection('bookings').doc();
    const tempSlotIds: string[] = [];
    
    try {
        await db.runTransaction(async (transaction) => {
            // 1. Check for slot availability before doing anything else
            const overlapQuery = db.collection('slots').where('dateString', '==', bookingDateString);
            const existingSlotsSnap = await transaction.get(overlapQuery);
            
            for (const proposedSlot of slots) {
                const proposedStart = new Date(proposedSlot.startAt);
                const proposedEnd = new Date(proposedSlot.endAt);
                const hasOverlap = existingSlotsSnap.docs.some(doc => {
                    const s = doc.data();
                    const existingStart = s.startAt.toDate();
                    const existingEnd = s.endAt.toDate();
                    return proposedStart < existingEnd && proposedEnd > existingStart;
                });
                if (hasOverlap) {
                    throw new functions.https.HttpsError('already-exists', `Slot ${proposedStart.toLocaleTimeString()} - ${proposedEnd.toLocaleTimeString()} is no longer available.`);
                }
            }

            // 2. Create temporary slot documents with 'pending' status
            for (const slot of slots) {
                 const startAt = new Date(slot.startAt);
                 const endAt = new Date(slot.endAt);
                 const newSlotRef = db.collection('slots').doc();
                 transaction.set(newSlotRef, {
                    groundId: 'avit-ground',
                    dateString: startAt.toISOString().split('T')[0],
                    startTime: startAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit'}),
                    endTime: endAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit'}),
                    startAt: admin.firestore.Timestamp.fromDate(startAt),
                    endAt: admin.firestore.Timestamp.fromDate(endAt),
                    price: slot.price,
                    status: 'pending', // IMPORTANT: Status is 'pending'
                    bookingId: bookingRef.id, // Link to the pending booking
                 });
                 tempSlotIds.push(newSlotRef.id);
            }

            // 3. Create the booking document with 'pending' status
            transaction.set(bookingRef, {
                uid: context.auth.uid,
                groundId: 'avit-ground',
                date: bookingDateString,
                slots: tempSlotIds,
                addons: addons,
                totalAmount: totalAmount,
                status: 'pending', // IMPORTANT
                payment: {
                    status: 'pending', // IMPORTANT
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                },
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        });

        // 4. Create Razorpay order
        const options = {
            amount: totalAmount * 100, // Amount in paise
            currency: 'INR',
            receipt: bookingRef.id,
            notes: {
                bookingId: bookingRef.id,
                uid: context.auth.uid,
            }
        };

        const order = await razorpay.orders.create(options);
        
        // 5. Update booking with Razorpay order ID
        await bookingRef.update({ 'payment.orderId': order.id });

        return { success: true, orderId: order.id, bookingId: bookingRef.id, amount: order.amount };

    } catch (error: any) {
        console.error("Error creating Razorpay order:", error);
        // Clean up pending documents if something went wrong
        const batch = db.batch();
        tempSlotIds.forEach(id => batch.delete(db.collection('slots').doc(id)));
        batch.delete(bookingRef);
        await batch.commit();

        throw new functions.https.HttpsError('internal', error.message || 'Failed to create booking intent.', error);
    }
});


/**
 * Verifies the payment signature from Razorpay and finalizes the booking.
 */
export const verifyPayment = functions.https.onCall(async (data, context) => {
     if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, bookingId } = data;
    
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !bookingId) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing payment verification details.');
    }

    // 1. Verify signature
    const secret = functions.config().razorpay.key_secret;
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto.createHmac('sha256', secret).update(body.toString()).digest('hex');

    if (expectedSignature !== razorpay_signature) {
        throw new functions.https.HttpsError('unauthenticated', 'Invalid payment signature.');
    }

    // 2. Signature is valid, finalize the booking in a transaction
    try {
        const bookingRef = db.collection('bookings').doc(bookingId);

        await db.runTransaction(async (transaction) => {
            const bookingDoc = await transaction.get(bookingRef);
            if (!bookingDoc.exists) {
                throw new Error("Booking not found!");
            }
            const bookingData = bookingDoc.data()!;

            // Idempotency check: if already paid, do nothing
            if (bookingData.status === 'paid') {
                return;
            }
            
            // Update booking to 'paid'
            transaction.update(bookingRef, {
                status: 'paid',
                'payment.status': 'paid',
                'payment.razorpayPaymentId': razorpay_payment_id,
                'payment.capturedAt': admin.firestore.FieldValue.serverTimestamp()
            });

            // Update slots to 'booked'
            for (const slotId of bookingData.slots) {
                const slotRef = db.collection('slots').doc(slotId);
                transaction.update(slotRef, { status: 'booked' });
            }

            // Decrement stock
            for (const addon of bookingData.addons || []) {
                const accRef = db.collection('accessories').doc(addon.id);
                transaction.update(accRef, { stock: admin.firestore.FieldValue.increment(-1 * (addon.quantity || 1)) });
            }

            // Award loyalty points
            const points = Math.floor((bookingData.totalAmount || 0) / 100);
            if (points > 0) {
                const userRef = db.collection('users').doc(bookingData.uid);
                transaction.update(userRef, { loyaltyPoints: admin.firestore.FieldValue.increment(points) });
            }
        });

        return { success: true };

    } catch (error: any) {
         console.error("Error verifying payment and finalizing booking:", error);
        // If finalization fails, we have a problem. The webhook should eventually fix it.
        // For now, report an error to the user.
        throw new functions.https.HttpsError('internal', 'Could not finalize your booking. Please contact support if payment was deducted.', error);
    }
});


/**
 * Reliable webhook handler from Razorpay. This is the source of truth.
 */
export const razorpayWebhook = functions.https.onRequest(async (req, res) => {
  const secret = functions.config().razorpay.webhook_secret;
  const signature = req.headers['x-razorpay-signature'];
  
  if (!secret || !signature) {
    console.warn("Razorpay webhook secret or signature is missing.");
    return res.status(400).send('Configuration error.');
  }

  try {
    // 1. Verify webhook signature
    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');

    if (digest !== signature) {
      console.warn("Invalid Razorpay webhook signature received.");
      return res.status(400).send('Invalid signature');
    }
    
    // 2. Process the event
    const payload = req.body;

    if (payload.event === 'order.paid') {
      const order = payload.payload.order.entity;
      const bookingId = order.receipt; // We set receipt to bookingId
      const razorpayPaymentId = payload.payload.payment.entity.id;
      const bookingRef = db.collection('bookings').doc(bookingId);
      
      const bookingDoc = await bookingRef.get();
      if (!bookingDoc.exists) {
          console.error(`Webhook received for non-existent booking ID: ${bookingId}`);
          return res.status(200).send('ok (booking not found)');
      }

      const bookingData = bookingDoc.data()!;
      // Idempotency: If already handled (by client-side verify or previous webhook), do nothing.
      if (bookingData.status === 'paid') {
          console.log(`Booking ${bookingId} already marked as paid. Ignoring webhook.`);
          return res.status(200).send('ok');
      }

      // Run the finalization logic
      const batch = db.batch();
      batch.update(bookingRef, {
        status: 'paid',
        'payment.razorpayPaymentId': razorpayPaymentId,
        'payment.status': 'paid',
        'payment.capturedAt': admin.firestore.FieldValue.serverTimestamp()
      });

      for (const slotId of bookingData.slots) {
        const slotRef = db.collection('slots').doc(slotId);
        batch.update(slotRef, { status: 'booked' });
      }

      for (const addon of bookingData.addons || []) {
        const accRef = db.collection('accessories').doc(addon.id);
        batch.update(accRef, { stock: admin.firestore.FieldValue.increment(-1 * (addon.quantity || 1)) });
      }
      
      const points = Math.floor((bookingData.totalAmount || 0) / 100);
      if(points > 0) {
          const userRef = db.collection('users').doc(bookingData.uid);
          batch.update(userRef, { loyaltyPoints: admin.firestore.FieldValue.increment(points) });
      }

      await batch.commit();
      console.log(`Successfully processed webhook for booking ${bookingId}`);
    } else if (payload.event === 'payment.failed') {
        const order = payload.payload.order.entity;
        const bookingId = order.receipt;
        const bookingRef = db.collection('bookings').doc(bookingId);
        const bookingDoc = await bookingRef.get();
        if(bookingDoc.exists && bookingDoc.data()!.status !== 'paid') {
            const bookingData = bookingDoc.data()!;
            const batch = db.batch();
            // Mark booking as failed
            batch.update(bookingRef, { status: 'failed', 'payment.status': 'failed' });
            // Delete the temporary pending slots
            for (const slotId of bookingData.slots) {
                batch.delete(db.collection('slots').doc(slotId));
            }
            await batch.commit();
            console.log(`Payment failed for booking ${bookingId}. Pending slots deleted.`);
        }
    }

    res.status(200).send('ok');
  } catch (error: any) {
    console.error("Error in Razorpay webhook handler:", error);
    res.status(500).send('Webhook processing error');
  }
});
