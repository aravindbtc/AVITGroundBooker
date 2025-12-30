
import { NextResponse } from 'next/server';
import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';
import crypto from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';

export const dynamic = "force-dynamic";

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
            if (bookingData.payment.razorpayPaymentId === razorpayPaymentId) {
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
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
        console.error("Razorpay webhook secret is not configured.");
        return new Response('Webhook service is not configured.', { status: 500 });
    }
    
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
        console.warn("Razorpay webhook signature is missing.");
        return new Response('Signature missing.', { status: 400 });
    }
    
    const bodyText = await req.text();

    try {
        const shasum = crypto.createHmac('sha256', secret);
        shasum.update(bodyText);
        const digest = shasum.digest('hex');

        if (digest !== signature) {
            console.warn("Invalid Razorpay webhook signature received.");
            return new Response('Invalid signature', { status: 400 });
        }
        
        const body = JSON.parse(bodyText);
        const event = body.event;
        const payload = body.payload;
        const db = getAdminDb();

        if (event === 'order.paid') {
            const order = payload.order.entity;
            const payment = payload.payment.entity;
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
            
            // Hardened Idempotency Check
            if (bookingData.status === 'paid' && bookingData.payment?.razorpayPaymentId === payment.id) {
                console.log(`Webhook: Payment ID ${payment.id} for booking ${bookingId} has already been processed.`);
                return new Response('ok (already processed)', { status: 200 });
            }

            if (bookingData.totalAmount * 100 !== order.amount) {
                console.error(`Webhook: Amount mismatch for booking ${bookingId}. Expected ${bookingData.totalAmount * 100}, got ${order.amount}`);
                await db.collection('bookings').doc(bookingId).update({ status: 'failed', 'payment.status': 'failed', 'payment.error': 'Amount mismatch' });
                return new Response('Amount mismatch', { status: 400 });
            }

            await finalizeBooking(bookingId, payment.id);
            console.log(`Successfully processed webhook for booking ${bookingId}`);

        } else if (event === 'payment.failed') {
            const payment = payload.payment.entity;
            // The booking ID should be in the order receipt, which is available in payment notes
            const bookingId = payment.notes?.bookingId || payload.order?.entity?.receipt;

            if (bookingId) {
                const bookingRef = db.collection('bookings').doc(bookingId);
                const bookingDoc = await bookingRef.get();
            
                if(bookingDoc.exists && bookingDoc.data()!.status === 'pending') {
                    const bookingData = bookingDoc.data()!;
                    const batch = db.batch();
                    // Mark booking as failed
                    batch.update(bookingRef, { status: 'failed', 'payment.status': 'failed' });
                    // Delete the temporary pending slots to release them
                    for (const slotId of bookingData.slots) {
                        batch.delete(db.collection('slots').doc(slotId));
                    }
                    await batch.commit();
                    console.log(`Payment failed for booking ${bookingId}. Pending slots released.`);
                }
            } else {
                 console.warn("Webhook: Payment failed event received without a bookingId.");
            }
        }

        return new Response('ok', { status: 200 });
    } catch (error: any) {
        console.error("Error in Razorpay webhook handler:", error);
        return new Response('Webhook processing error', { status: 500 });
    }
}
