
import { NextResponse } from 'next/server';
import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';
import crypto from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { checkRateLimit } from '@/lib/rate-limiter';
import { validatePaymentVerification } from '@/lib/validators';
import { createErrorResponse, createSuccessResponse, getClientIdentifier, logPaymentTransaction } from '@/lib/api-utils';

export const dynamic = "force-dynamic";

const API_TIMEOUT_MS = 30000;
const MAX_REQUESTS_PER_MINUTE = 10;

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
    // 1. RATE LIMITING
    const clientId = getClientIdentifier(req);
    if (!checkRateLimit(clientId, MAX_REQUESTS_PER_MINUTE, 60)) {
        return createErrorResponse(
            'Rate limit exceeded. Maximum 10 verification attempts per minute.',
            429,
            'RATE_LIMIT_EXCEEDED'
        );
    }

    // 2. CONFIG VALIDATION
    if (!process.env.RAZORPAY_KEY_SECRET) {
        console.error("Razorpay secret key is not configured.");
        return createErrorResponse(
            "Payment verification is not configured on the server.",
            500,
            'CONFIG_ERROR'
        );
    }

    // 3. AUTHENTICATION
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) {
        return createErrorResponse('Authentication is required.', 401, 'MISSING_AUTH');
    }

    let uid: string;
    try {
        const decodedToken = await getAdminAuth().verifyIdToken(token);
        uid = decodedToken.uid;
    } catch (error) {
        console.error("Firebase Auth Error:", error);
        return createErrorResponse('Invalid authentication token.', 403, 'INVALID_TOKEN');
    }

    try {
        // 4. REQUEST PARSING WITH TIMEOUT
        const requestBody = await Promise.race([
            req.json(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timeout')), API_TIMEOUT_MS)
            )
        ]);

        // 5. INPUT VALIDATION
        const validation = validatePaymentVerification(requestBody);
        if (!validation.success) {
            logPaymentTransaction('verification_failed', requestBody.bookingId, {
                userId: uid,
                error: `Validation failed: ${validation.error?.message}`
            });
            return createErrorResponse(
                `Invalid payment data: ${validation.error?.message}`,
                400,
                'VALIDATION_ERROR'
            );
        }

        const { razorpay_payment_id, razorpay_order_id, razorpay_signature, bookingId } = validation.data;

        const db = getAdminDb();
        const bookingRef = db.collection('bookings').doc(bookingId);
        const bookingDoc = await bookingRef.get();

        // 6. BOOKING AUTHORIZATION & VALIDATION
        if (!bookingDoc.exists) {
            logPaymentTransaction('verification_failed', bookingId, {
                userId: uid,
                error: 'Booking not found'
            });
            return createErrorResponse('Booking not found.', 404, 'BOOKING_NOT_FOUND');
        }

        const bookingData = bookingDoc.data()!;
        
        if (bookingData.uid !== uid) {
            console.warn(`Unauthorized payment verification attempt for booking ${bookingId} by user ${uid}`);
            logPaymentTransaction('verification_failed', bookingId, {
                userId: uid,
                error: 'Unauthorized access'
            });
            return createErrorResponse('You do not have permission to verify this booking.', 403, 'UNAUTHORIZED');
        }

        // 7. PREVENT REPLAY ATTACKS - Check if already verified
        if (bookingData.status === 'paid') {
            console.warn(`Duplicate verification attempt for booking ${bookingId}`);
            logPaymentTransaction('verification_duplicate', bookingId, {
                userId: uid,
                message: 'Already verified'
            });
            return createSuccessResponse({
                success: true,
                message: 'Booking already verified'
            }, 200);
        }

        // 8. VALIDATE ORDER ID MATCH
        if (bookingData.payment?.orderId !== razorpay_order_id) {
            logPaymentTransaction('verification_failed', bookingId, {
                userId: uid,
                error: 'Order ID mismatch',
                expectedOrderId: bookingData.payment?.orderId,
                receivedOrderId: razorpay_order_id
            });
            return createErrorResponse('Order ID does not match the booking.', 400, 'ORDER_MISMATCH');
        }

        // 9. SIGNATURE VERIFICATION with SHA256-HMAC
        // Format: order_id|payment_id
        const secret = process.env.RAZORPAY_KEY_SECRET!;
        const signatureBody = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(signatureBody)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            console.error(`Invalid signature for booking ${bookingId}. Expected: ${expectedSignature}, Got: ${razorpay_signature}`);
            
            // Mark booking as failed immediately
            await bookingRef.update({
                status: 'failed',
                'payment.status': 'failed',
                'payment.failureReason': 'Invalid signature',
                'payment.failedAt': FieldValue.serverTimestamp(),
            });

            logPaymentTransaction('verification_failed', bookingId, {
                userId: uid,
                error: 'Invalid signature verification'
            });

            return createErrorResponse(
                'Invalid payment signature. Booking has been marked as failed.',
                400,
                'INVALID_SIGNATURE'
            );
        }

        logPaymentTransaction('verified', bookingId, {
            userId: uid,
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id
        });

        // 10. FINALIZE BOOKING
        await finalizeBooking(bookingId, razorpay_payment_id);

        return createSuccessResponse({
            success: true,
            message: 'Payment verified and booking finalized'
        }, 200);

    } catch (error: any) {
        console.error("Error verifying payment:", error);
        return createErrorResponse(
            'Could not verify payment. Please contact support if issue persists.',
            500,
            'VERIFICATION_ERROR'
        );
    }
}
