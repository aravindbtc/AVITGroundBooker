
import { NextResponse } from 'next/server';
import { db } from '@/firebase/server';
import crypto from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';

const finalizeBooking = async (bookingId: string, razorpayPaymentId: string) => {
    const bookingRef = db.collection('bookings').doc(bookingId);

    return db.runTransaction(async (transaction) => {
        const bookingDoc = await transaction.get(bookingRef);
        if (!bookingDoc.exists) {
            console.error(`FinalizeBooking: Booking ${bookingId} not found.`);
            return;
        }
        const bookingData = bookingDoc.data()!;

        if (bookingData.status === 'paid') {
            console.log(`FinalizeBooking: Booking ${bookingId} is already paid.`);
            return;
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
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;
    const signature = req.headers.get('x-razorpay-signature');

    if (!secret || !signature) {
        console.warn("Razorpay webhook secret or signature is missing.");
        return new Response('Configuration error.', { status: 400 });
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

        if (event === 'order.paid') {
            const order = payload.order.entity;
            const payment = payload.payment.entity;
            const bookingId = order.receipt; 

            const bookingDoc = await db.collection('bookings').doc(bookingId).get();
            if (!bookingDoc.exists) {
                console.error(`Webhook: Paid event for non-existent booking ${bookingId}`);
                return new Response('ok (booking not found)', { status: 200 });
            }
      
            const bookingData = bookingDoc.data()!;
            if (bookingData.totalAmount * 100 !== order.amount) {
                console.error(`Webhook: Amount mismatch for booking ${bookingId}. Expected ${bookingData.totalAmount * 100}, got ${order.amount}`);
                return new Response('Amount mismatch', { status: 400 });
            }

            await finalizeBooking(bookingId, payment.id);
            console.log(`Successfully processed webhook for booking ${bookingId}`);

        } else if (event === 'payment.failed') {
            const payment = payload.payment.entity;
            const bookingId = payment.notes.bookingId;
            if (bookingId) {
                const bookingRef = db.collection('bookings').doc(bookingId);
                const bookingDoc = await bookingRef.get();
            
                if(bookingDoc.exists && bookingDoc.data()!.status === 'pending') {
                    const bookingData = bookingDoc.data()!;
                    const batch = db.batch();
                    batch.update(bookingRef, { status: 'failed', 'payment.status': 'failed' });
                    for (const slotId of bookingData.slots) {
                        batch.delete(db.collection('slots').doc(slotId));
                    }
                    await batch.commit();
                    console.log(`Payment failed for booking ${bookingId}. Pending slots released.`);
                }
            }
        }

        return new Response('ok', { status: 200 });
    } catch (error: any) {
        console.error("Error in Razorpay webhook handler:", error);
        return new Response('Webhook processing error', { status: 500 });
    }
}
