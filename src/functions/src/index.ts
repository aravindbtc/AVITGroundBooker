
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Razorpay from 'razorpay';
import crypto = require('crypto');

admin.initializeApp();
const db = admin.firestore();

// Make sure to set these in your Firebase environment config
// firebase functions:config:set razorpay.key_id="YOUR_KEY_ID" razorpay.key_secret="YOUR_KEY_SECRET" razorpay.webhook_secret="YOUR_WEBHOOK_SECRET"
const razorpay = new Razorpay({
    key_id: functions.config().razorpay.key_id,
    key_secret: functions.config().razorpay.key_secret,
});

const PENDING_BOOKING_EXPIRY_MINUTES = 10;


/**
 * Creates a pending booking and a Razorpay order. Does NOT confirm the booking.
 * This function creates a temporary "lock" on the requested slots.
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
    const manpowerAddons = addons.filter((a: any) => a.type === 'manpower');
    const bookingRef = db.collection('bookings').doc(); // Create a new booking ID
    const tempSlotIds: string[] = [];
    
    try {
        // 1. Create Razorpay order FIRST. We use its ID as our receipt.
        const options = {
            amount: totalAmount * 100, // Amount in paise
            currency: 'INR',
            receipt: bookingRef.id, // Use our Firestore booking ID as the receipt
            notes: {
                bookingId: bookingRef.id,
                uid: context.auth.uid,
            }
        };
        const order = await razorpay.orders.create(options);
        
        // 2. Now, create the pending booking in a transaction
        await db.runTransaction(async (transaction) => {
            // Re-check slot availability
            for (const proposedSlot of slots) {
                const proposedStart = new Date(proposedSlot.startAt);
                const proposedEnd = new Date(proposedSlot.endAt);
                 const overlapQuery = db.collection('slots')
                    .where('dateString', '==', bookingDateString)
                    .where('status', 'in', ['booked', 'pending']) // Check against booked and other pending slots
                    .where('startAt', '<', admin.firestore.Timestamp.fromDate(proposedEnd))
                    .where('endAt', '>', admin.firestore.Timestamp.fromDate(proposedStart));
                
                const existingSlotsSnap = await transaction.get(overlapQuery);
                if (!existingSlotsSnap.empty) {
                    throw new functions.https.HttpsError('already-exists', `A time slot between ${proposedStart.toLocaleTimeString()} - ${proposedEnd.toLocaleTimeString()} is no longer available.`);
                }
            }

            // Re-check manpower availability
             if (manpowerAddons.length > 0) {
                // Find all *confirmed* slots on the selected date that have manpower addons
                const bookedSlotsOnDateQuery = db.collection('slots')
                    .where('dateString', '==', bookingDateString)
                    .where('status', '==', 'booked');

                const bookedSlotsSnap = await transaction.get(bookedSlotsOnDateQuery);
                const busyManpowerIds = new Set<string>();

                bookedSlotsSnap.docs.forEach(slotDoc => {
                    const slotData = slotDoc.data();
                    if (slotData.addons && Array.isArray(slotData.addons)) {
                        slotData.addons.forEach((addon: any) => {
                            if (addon.type === 'manpower') {
                                busyManpowerIds.add(addon.id);
                            }
                        });
                    }
                });
                
                const unavailableManpower = manpowerAddons.filter((m: any) => busyManpowerIds.has(m.id));

                if (unavailableManpower.length > 0) {
                    const names = unavailableManpower.map(m => m.name).join(', ');
                    throw new functions.https.HttpsError('already-exists', `The following are unavailable on this date: ${names}.`);
                }
            }

            // Create temporary slot documents with 'pending' status
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
                    status: 'pending', // IMPORTANT
                    bookingId: bookingRef.id,
                 });
                 tempSlotIds.push(newSlotRef.id);
            }
            
            // Create the booking doc with 'pending' status and expiry
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + PENDING_BOOKING_EXPIRY_MINUTES);

            transaction.set(bookingRef, {
                uid: context.auth.uid,
                groundId: 'avit-ground',
                date: bookingDateString,
                slots: tempSlotIds,
                addons: addons,
                totalAmount: totalAmount,
                status: 'pending', // IMPORTANT
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                expiresAt: admin.firestore.Timestamp.fromDate(expiresAt), // IMPORTANT
                payment: {
                    orderId: order.id, // Store Razorpay Order ID
                    status: 'created', // Payment status
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                },
            });
        });

        return { success: true, orderId: order.id, bookingId: bookingRef.id, amount: order.amount };

    } catch (error: any) {
        console.error("Error creating Razorpay order:", error);
        // If transaction fails, there are no docs to clean up.
        throw new functions.https.HttpsError('internal', error.message || 'Failed to create booking intent.', error);
    }
});

/**
 * Finalizes a booking. This function should be called by a trusted source (like the webhook).
 * It is idempotent, meaning it can be run multiple times without causing issues.
 */
const finalizeBooking = async (bookingId: string, razorpayPaymentId: string) => {
    const bookingRef = db.collection('bookings').doc(bookingId);

    return db.runTransaction(async (transaction) => {
        const bookingDoc = await transaction.get(bookingRef);
        if (!bookingDoc.exists) {
            console.error(`FinalizeBooking: Booking ${bookingId} not found.`);
            return; // Exit gracefully
        }
        const bookingData = bookingDoc.data()!;

        // Idempotency check: if already paid, do nothing.
        if (bookingData.status === 'paid') {
            console.log(`FinalizeBooking: Booking ${bookingId} is already paid.`);
            return;
        }

        // Update booking to 'paid' and remove expiry
        transaction.update(bookingRef, {
            status: 'paid',
            'payment.status': 'paid',
            'payment.razorpayPaymentId': razorpayPaymentId,
            'payment.capturedAt': admin.firestore.FieldValue.serverTimestamp(),
            expiresAt: admin.firestore.FieldValue.delete(), // Remove expiry on confirmation
        });

        // Update slots to 'booked'
        for (const slotId of bookingData.slots) {
            const slotRef = db.collection('slots').doc(slotId);
            transaction.update(slotRef, { 
                status: 'booked',
                addons: bookingData.addons,
            });
        }

        // Decrement stock for 'item' type addons
        for (const addon of bookingData.addons || []) {
            if (addon.type === 'item') {
                const accRef = db.collection('accessories').doc(addon.id);
                transaction.update(accRef, { stock: admin.firestore.FieldValue.increment(-1 * (addon.quantity || 1)) });
            }
        }

        // Award loyalty points
        const points = Math.floor((bookingData.totalAmount || 0) / 100);
        if (points > 0) {
            const userRef = db.collection('users').doc(bookingData.uid);
            transaction.update(userRef, { loyaltyPoints: admin.firestore.FieldValue.increment(points) });
        }
    });
};


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
    const event = req.body.event;
    const payload = req.body.payload;

    if (event === 'order.paid') {
      const order = payload.order.entity;
      const payment = payload.payment.entity;
      const bookingId = order.receipt; // We set receipt to our bookingId

      // Verify amount from a trusted source (the order entity from the webhook)
      const bookingDoc = await db.collection('bookings').doc(bookingId).get();
      if (!bookingDoc.exists) {
          console.error(`Webhook: Paid event for non-existent booking ${bookingId}`);
          return res.status(200).send('ok (booking not found)');
      }
      
      const bookingData = bookingDoc.data()!;
      if (bookingData.totalAmount * 100 !== order.amount) {
           console.error(`Webhook: Amount mismatch for booking ${bookingId}. Expected ${bookingData.totalAmount * 100}, got ${order.amount}`);
           // Potentially flag for manual review
           return res.status(400).send('Amount mismatch');
      }

      await finalizeBooking(bookingId, payment.id);
      console.log(`Successfully processed webhook for booking ${bookingId}`);

    } else if (event === 'payment.failed') {
        const order = payload.payment.entity;
        const bookingId = order.notes.bookingId;
        const bookingRef = db.collection('bookings').doc(bookingId);
        const bookingDoc = await bookingRef.get();
        
        if(bookingDoc.exists && bookingDoc.data()!.status === 'pending') {
            const bookingData = bookingDoc.data()!;
            const batch = db.batch();
            // Mark booking as failed
            batch.update(bookingRef, { status: 'failed', 'payment.status': 'failed' });
            // Delete the temporary pending slots
            for (const slotId of bookingData.slots) {
                batch.delete(db.collection('slots').doc(slotId));
            }
            await batch.commit();
            console.log(`Payment failed for booking ${bookingId}. Pending slots released.`);
        }
    }

    res.status(200).send('ok');
  } catch (error: any) {
    console.error("Error in Razorpay webhook handler:", error);
    res.status(500).send('Webhook processing error');
  }
});


/**
 * Client-callable function to verify payment for faster UX.
 * The webhook is the ultimate source of truth, but this gives immediate feedback.
 */
export const verifyPayment = functions.https.onCall(async (data, context) => {
     if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, bookingId } = data;
    
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !bookingId) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing payment verification details.');
    }
    
    // Security: Fetch booking by bookingId, but validate ownership and orderId.
    const bookingRef = db.collection('bookings').doc(bookingId);
    const bookingDoc = await bookingRef.get();

    if (!bookingDoc.exists || bookingDoc.data()?.uid !== context.auth.uid) {
        throw new functions.https.HttpsError('not-found', 'Booking not found or you do not have permission to access it.');
    }
     if (bookingDoc.data()?.payment.orderId !== razorpay_order_id) {
        throw new functions.https.HttpsError('invalid-argument', 'Order ID mismatch.');
    }


    // Verify signature
    const secret = functions.config().razorpay.key_secret;
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto.createHmac('sha256', secret).update(body.toString()).digest('hex');

    if (expectedSignature !== razorpay_signature) {
        throw new functions.https.HttpsError('unauthenticated', 'Invalid payment signature.');
    }

    try {
        // Signature is valid, finalize the booking
        await finalizeBooking(bookingId, razorpay_payment_id);
        return { success: true };
    } catch (error: any) {
         console.error("Error in verifyPayment:", error);
        // If finalization fails, the webhook should eventually fix it.
        throw new functions.https.HttpsError('internal', 'Could not finalize your booking. Please contact support if payment was deducted.', error);
    }
});

/**
 * Scheduled function to clean up expired pending bookings.
 * Runs periodically (e.g., every hour).
 */
export const cleanupExpiredBookings = functions.pubsub.schedule('every 60 minutes').onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    const query = db.collection('bookings').where('status', '==', 'pending').where('expiresAt', '<=', now);
    
    const expiredBookings = await query.get();
    
    if (expiredBookings.empty) {
        console.log("No expired pending bookings to clean up.");
        return null;
    }

    const batch = db.batch();
    
    expiredBookings.docs.forEach(doc => {
        const booking = doc.data();
        console.log(`Cleaning up expired booking: ${doc.id}`);
        
        // Mark booking as 'failed'
        batch.update(doc.ref, { status: 'failed', 'payment.status': 'failed' });
        
        // Delete the associated pending slots
        if (booking.slots && Array.isArray(booking.slots)) {
            booking.slots.forEach((slotId: string) => {
                const slotRef = db.collection('slots').doc(slotId);
                batch.delete(slotRef);
            });
        }
    });
    
    await batch.commit();
    console.log(`Cleaned up ${expiredBookings.size} expired bookings.`);
    return null;
});
