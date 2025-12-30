
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import crypto from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';

export const dynamic = "force-dynamic";

const finalizeBooking = async (bookingId: string, razorpayPaymentId: string) => {
    const db = getAdminDb();
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
     if (!process.env.RAZORPAY_KEY_SECRET) {
        console.error("Razorpay secret key is not configured.");
        return NextResponse.json({ success: false, error: "Payment processing is not configured on the server." }, { status: 500 });
    }

     try {
        const db = getAdminDb();
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature, bookingId, user } = await req.json();

        if (!user || !user.uid) {
            return NextResponse.json({ success: false, error: 'Authentication is required.' }, { status: 401 });
        }

        if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !bookingId) {
            return NextResponse.json({ success: false, error: 'Missing payment verification details.' }, { status: 400 });
        }

        const bookingRef = db.collection('bookings').doc(bookingId);
        const bookingDoc = await bookingRef.get();

        if (!bookingDoc.exists || bookingDoc.data()?.uid !== user.uid) {
            return NextResponse.json({ success: false, error: 'Booking not found or permission denied.' }, { status: 404 });
        }
        if (bookingDoc.data()?.payment.orderId !== razorpay_order_id) {
            return NextResponse.json({ success: false, error: 'Order ID mismatch.' }, { status: 400 });
        }

        const secret = process.env.RAZORPAY_KEY_SECRET!;
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto.createHmac('sha256', secret).update(body.toString()).digest('hex');

        if (expectedSignature !== razorpay_signature) {
            // Immediately mark booking as failed
             await bookingRef.update({ status: 'failed', 'payment.status': 'failed' });
            return NextResponse.json({ success: false, error: 'Invalid payment signature.' }, { status: 400 });
        }

        await finalizeBooking(bookingId, razorpay_payment_id);
        
        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Error in verifyPayment:", error);
        return NextResponse.json({ success: false, error: 'Could not finalize your booking. Please contact support.' }, { status: 500 });
    }
}
