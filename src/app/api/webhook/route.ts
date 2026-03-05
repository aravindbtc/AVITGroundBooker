
import { NextResponse } from 'next/server';
import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';
import crypto from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { checkRateLimit } from '@/lib/rate-limiter';
import { logPaymentTransaction } from '@/lib/api-utils';

export const dynamic = "force-dynamic";

const MAX_WEBHOOK_REQUESTS_PER_MINUTE = 100;
const WEBHOOK_EVENT_TIMEOUT_HOURS = 48;

interface WebhookPayload {
    event: string;
    created_at: number;
    payload: {
        order?: { entity: any };
        payment?: { entity: any };
    };
}

// Helper function to store webhook event IDs for idempotency
const recordWebhookEvent = async (eventId: string): Promise<boolean> => {
    const db = getAdminDb();
    const eventRef = db.collection('webhook_events').doc(eventId);
    
    try {
        const eventDoc = await eventRef.get();
        if (eventDoc.exists) {
            console.log(`Webhook event ${eventId} already processed.`);
            return false; // Already processed
        }
        
        // Store event with TTL
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + WEBHOOK_EVENT_TIMEOUT_HOURS);
        
        await eventRef.set({
            processedAt: FieldValue.serverTimestamp(),
            expiresAt: expiresAt,
        });
        
        return true; // First time processing
    } catch (error) {
        console.error(`Error recording webhook event ${eventId}:`, error);
        return true; // Assume first time if error occurs
    }
};

const finalizeBooking = async (bookingId: string, razorpayPaymentId: string) => {
    const db = getAdminDb();
    const bookingRef = db.collection('bookings').doc(bookingId);

    return db.runTransaction(async (transaction) => {
        const bookingDoc = await transaction.get(bookingRef);
        if (!bookingDoc.exists) {
            console.error(`FinalizeBooking (Webhook): Booking ${bookingId} not found.`);
            return;
        }
        const bookingData = bookingDoc.data()!;

        // Idempotency Check: if already paid, do nothing.
        if (bookingData.status === 'paid') {
            console.log(`FinalizeBooking (Webhook): Booking ${bookingId} is already paid.`);
            // Also check if this specific payment ID has been recorded.
            if (bookingData.payment?.razorpayPaymentId === razorpayPaymentId) {
                console.log(`FinalizeBooking (Webhook): Payment ID ${razorpayPaymentId} already processed.`);
                return;
            }
        }

        transaction.update(bookingRef, {
            status: 'paid',
            'payment.status': 'paid',
            'payment.razorpayPaymentId': razorpayPaymentId,
            'payment.capturedAt': FieldValue.serverTimestamp(),
            expiresAt: FieldValue.delete(),
        });

        for (const slotId of bookingData.slots) {
            const slotRef = db.collection('slots').doc(slotId);
            transaction.update(slotRef, { 
                status: 'booked',
                addons: bookingData.addons,
            });
        }

        for (const addon of bookingData.addons || []) {
            if (addon.type === 'item') {
                const accRef = db.collection('accessories').doc(addon.id);
                transaction.update(accRef, { stock: FieldValue.increment(-1 * (addon.quantity || 1)) });
            }
        }

        const points = Math.floor((bookingData.totalAmount || 0) / 100);
        if (points > 0) {
            const userRef = db.collection('users').doc(bookingData.uid);
            transaction.update(userRef, { loyaltyPoints: FieldValue.increment(points) });
        }
    });
};

export async function POST(req: Request) {
    // 1. RATE LIMITING - Prevent webhook flooding
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(`webhook_${clientIp}`, MAX_WEBHOOK_REQUESTS_PER_MINUTE, 60)) {
        console.warn(`Webhook rate limit exceeded for IP: ${clientIp}`);
        return new Response('Rate limit exceeded', { status: 429 });
    }

    // 2. CONFIG VALIDATION
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
        console.error("Razorpay webhook secret is not configured.");
        return new Response('Webhook service is not configured.', { status: 500 });
    }
    
    // 3. ORIGIN VERIFICATION
    const signature = req.headers.get('x-razorpay-signature');
    if (!signature) {
        console.warn("Razorpay webhook signature is missing.");
        return new Response('Signature missing.', { status: 400 });
    }
    
    const bodyText = await req.text();

    try {
        // 4. SIGNATURE VERIFICATION
        const shasum = crypto.createHmac('sha256', secret);
        shasum.update(bodyText);
        const digest = shasum.digest('hex');

        if (digest !== signature) {
            console.warn("Invalid Razorpay webhook signature received.", { 
                expected: digest, 
                received: signature 
            });
            return new Response('Invalid signature', { status: 400 });
        }
        
        // 5. PARSE PAYLOAD
        const body: WebhookPayload = JSON.parse(bodyText);
        const { event, payload, created_at: eventTimestamp } = body;
        const db = getAdminDb();

        // 6. VALIDATE EVENT TIMESTAMP (prevent replay attacks)
        const eventAge = Date.now() / 1000 - eventTimestamp;
        if (eventAge > 3600) { // Event older than 1 hour
            console.warn(`Webhook event is too old: ${eventAge} seconds`, { event, eventId: body.id });
            return new Response('ok', { status: 200 }); // Return 200 to prevent retry
        }

        // 7. IDEMPOTENCY CHECK
        if (!body.id) {
            console.error('Webhook: Event received without an ID.');
            return new Response('ok (no event id)', { status: 200 });
        }

        const isFirstTime = await recordWebhookEvent(body.id);
        if (!isFirstTime) {
            console.log(`Webhook event ${body.id} already processed.`);
            return new Response('ok', { status: 200 });
        }

        // 8. EVENT PROCESSING
        if (event === 'order.paid' || event === 'payment.captured') {
            const order = payload.order?.entity;
            const payment = payload.payment?.entity;

            if (!order || !payment) {
                console.error('Webhook: Paid event missing order or payment entity.');
                return new Response('ok (invalid payload)', { status: 200 });
            }

            const bookingId = order.receipt; 

            if (!bookingId) {
                console.error('Webhook: Paid event received without a bookingId (receipt).');
                return new Response('ok (no booking id)', { status: 200 });
            }

            const bookingDoc = await db.collection('bookings').doc(bookingId).get();
            if (!bookingDoc.exists) {
                console.error(`Webhook: Paid event for non-existent booking ${bookingId}`);
                return new Response('ok (booking not found)', { status: 200 });
            }
      
            const bookingData = bookingDoc.data()!;
            
            // Amount validation
            const expectedAmount = bookingData.totalAmount * 100;
            if (expectedAmount !== order.amount) {
                console.error(`Webhook: Amount mismatch for booking ${bookingId}. Expected ${expectedAmount}, got ${order.amount}`);
                
                await db.collection('bookings').doc(bookingId).update({
                    status: 'failed',
                    'payment.status': 'failed',
                    'payment.failureReason': 'Amount mismatch',
                    'payment.failedAt': FieldValue.serverTimestamp(),
                });

                logPaymentTransaction('failed', bookingId, {
                    error: `Amount mismatch: expected ${expectedAmount}, got ${order.amount}`
                });

                return new Response('ok', { status: 200 });
            }

            await finalizeBooking(bookingId, payment.id);
            
            logPaymentTransaction('captured', bookingId, {
                paymentId: payment.id,
                orderId: order.id,
                amount: order.amount / 100
            });

            console.log(`Successfully processed webhook for booking ${bookingId}`);

        } else if (event === 'payment.failed' || event === 'order.cancelled') {
            const payment = payload.payment?.entity;
            const order = payload.order?.entity;
            
            // Extract booking ID from multiple possible sources
            let bookingId = null;
            if (order?.receipt) bookingId = order.receipt;
            else if (payment?.notes?.bookingId) bookingId = payment.notes.bookingId;
            else if (payment?.order_id) {
                // Fetch order to get receipt
                try {
                    const orderRef = db.collection('bookings').where('payment.orderId', '==', payment.order_id);
                    const snap = await orderRef.limit(1).get();
                    if (!snap.empty) bookingId = snap.docs[0].id;
                } catch (e) {
                    console.warn('Could not find booking by order ID');
                }
            }

            if (bookingId) {
                const bookingRef = db.collection('bookings').doc(bookingId);
                const bookingDoc = await bookingRef.get();
            
                if (bookingDoc.exists && bookingDoc.data()!.status === 'pending') {
                    const bookingData = bookingDoc.data()!;
                    const batch = db.batch();
                    
                    // Mark booking as failed
                    batch.update(bookingRef, {
                        status: 'failed',
                        'payment.status': 'failed',
                        'payment.failureReason': payment?.error_description || 'Payment declined',
                        'payment.failedAt': FieldValue.serverTimestamp(),
                    });
                    
                    // Delete the temporary pending slots to release them
                    for (const slotId of bookingData.slots) {
                        batch.delete(db.collection('slots').doc(slotId));
                    }
                    
                    await batch.commit();
                    
                    logPaymentTransaction('failed', bookingId, {
                        reason: payment?.error_description || 'Payment declined'
                    });

                    console.log(`Payment failed for booking ${bookingId}. Pending slots released.`);
                }
            } else {
                console.warn("Webhook: Payment failed event received without a valid bookingId.");
            }
        } else {
            console.info(`Webhook: Unhandled event type: ${event}`);
        }

        return new Response('ok', { status: 200 });
    } catch (error: any) {
        console.error("Error in Razorpay webhook handler:", error);
        // Return 500 to trigger Razorpay retry
        return new Response('Webhook processing error', { status: 500 });
    }
}
