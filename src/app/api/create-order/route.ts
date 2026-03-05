
import { NextResponse } from 'next/server';
import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';
import Razorpay from 'razorpay';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { Accessory } from '@/lib/types';
import { checkRateLimit, getRemainingRequests } from '@/lib/rate-limiter';
import { validateBookingPayload } from '@/lib/validators';
import { createErrorResponse, createSuccessResponse, getClientIdentifier, logPaymentTransaction } from '@/lib/api-utils';

export const dynamic = "force-dynamic";

const PENDING_BOOKING_EXPIRY_MINUTES = 10;
const API_TIMEOUT_MS = 30000; // 30 seconds
const MAX_REQUESTS_PER_MINUTE = 20; // Per user

export async function POST(req: Request) {
    // 1. RATE LIMITING - Prevent abuse
    const clientId = getClientIdentifier(req);
    if (!checkRateLimit(clientId, MAX_REQUESTS_PER_MINUTE, 60)) {
        const remaining = getRemainingRequests(clientId, MAX_REQUESTS_PER_MINUTE);
        return createErrorResponse(
            `Rate limit exceeded. Maximum ${MAX_REQUESTS_PER_MINUTE} requests per minute. Try again in 60 seconds.`,
            429,
            'RATE_LIMIT_EXCEEDED'
        );
    }

    // 2. CONFIG VALIDATION
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        console.error("Razorpay environment variables are not configured.");
        return createErrorResponse(
            "Payment processing is not configured on the server.",
            500,
            'CONFIG_ERROR'
        );
    }

    // 3. AUTHENTICATION - Verify token
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

    const db = getAdminDb();
    const bookingRef = db.collection('bookings').doc();
    const tempSlotIds: string[] = [];

    try {
        // 4. REQUEST PARSING WITH TIMEOUT
        const requestBody = await Promise.race([
            req.json(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timeout')), API_TIMEOUT_MS)
            )
        ]);

        // 5. INPUT VALIDATION - Validate before processing
        const validation = validateBookingPayload(requestBody);
        if (!validation.success) {
            logPaymentTransaction('failed', bookingRef.id, {
                userId: uid,
                error: `Validation failed: ${validation.error?.message}`
            });
            return createErrorResponse(
                `Invalid booking data: ${validation.error?.message}`,
                400,
                'VALIDATION_ERROR'
            );
        }

        const { slots, addons = [] } = validation.data;
        
        logPaymentTransaction('initiated', bookingRef.id, {
            userId: uid,
            slotCount: slots.length,
            addonCount: addons.length
        });

        // --- SERVER-SIDE PRICE VALIDATION ---
        let serverCalculatedTotalAmount = 0;

        // 1. Calculate total from addon prices fetched securely from Firestore
        if (addons.length > 0) {
            const addonIds = addons.map((a: any) => a.id);
            const accessoriesSnap = await db.collection('accessories').where(FieldValue.documentId(), 'in', addonIds).get();
            
            const accessoryPrices: { [id: string]: number } = {};
            accessoriesSnap.forEach(doc => {
                accessoryPrices[doc.id] = (doc.data() as Accessory).price;
            });

            // Ensure all requested addons were found in the database
            if (accessoriesSnap.size !== addonIds.length) {
                throw new Error("One or more selected add-ons could not be found.");
            }

            for (const clientAddon of addons) {
                const serverPrice = accessoryPrices[clientAddon.id];
                if (serverPrice === undefined) {
                    throw new Error(`Addon ${clientAddon.id} is invalid or not available.`);
                }
                if (clientAddon.quantity <= 0 || clientAddon.quantity > 100) {
                    throw new Error(`Invalid addon quantity: ${clientAddon.quantity}`);
                }
                serverCalculatedTotalAmount += serverPrice * (clientAddon.quantity || 1);
            }
        }
        
        // 2. Add slot prices with validation
        const serverCalculatedSlotTotal = slots.reduce((sum: number, slot: any) => {
            if (!Number.isFinite(slot.price) || slot.price <= 0 || slot.price > 999999) {
                throw new Error(`Invalid slot price: ${slot.price}`);
            }
            return sum + slot.price;
        }, 0);
        serverCalculatedTotalAmount += serverCalculatedSlotTotal;

        if (serverCalculatedTotalAmount <= 0 || serverCalculatedTotalAmount > 999999) {
            return createErrorResponse(
                'Invalid total amount calculated.',
                400,
                'AMOUNT_VALIDATION_ERROR'
            );
        }
        // --- END OF VALIDATION ---

        const bookingDateString = new Date(slots[0].startAt).toISOString().split('T')[0];
        const manpowerAddons = addons.filter((a: any) => a.type === 'manpower');
    
        // Run Firestore transaction FIRST to validate and reserve slots
        await db.runTransaction(async (transaction) => {
            // Re-check slot availability
            for (const proposedSlot of slots) {
                const proposedStart = new Date(proposedSlot.startAt);
                const proposedEnd = new Date(proposedSlot.endAt);
                 const overlapQuery = db.collection('slots')
                    .where('dateString', '==', bookingDateString)
                    .where('status', 'in', ['booked', 'pending'])
                    .where('startAt', '<', Timestamp.fromDate(proposedEnd))
                    .where('endAt', '>', Timestamp.fromDate(proposedStart));
                
                const existingSlotsSnap = await transaction.get(overlapQuery);
                if (!existingSlotsSnap.empty) {
                    throw new Error(`A time slot between ${proposedStart.toLocaleTimeString()} - ${proposedEnd.toLocaleTimeString()} is no longer available.`);
                }
            }

            // Re-check manpower availability
             if (manpowerAddons.length > 0) {
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
                    const names = unavailableManpower.map((m:any) => m.name).join(', ');
                    throw new Error(`The following are unavailable on this date: ${names}.`);
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
                    startAt: Timestamp.fromDate(startAt),
                    endAt: Timestamp.fromDate(endAt),
                    price: slot.price,
                    status: 'pending',
                    bookingId: bookingRef.id,
                 });
                 tempSlotIds.push(newSlotRef.id);
            }
            
            // Create the booking doc with 'pending' status and expiry
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + PENDING_BOOKING_EXPIRY_MINUTES);

            transaction.set(bookingRef, {
                uid: uid,
                groundId: 'avit-ground',
                date: bookingDateString,
                slots: tempSlotIds,
                addons: addons,
                totalAmount: serverCalculatedTotalAmount,
                status: 'pending',
                createdAt: FieldValue.serverTimestamp(),
                expiresAt: Timestamp.fromDate(expiresAt),
            });
        });

        // If transaction succeeds, create the Razorpay order with timeout
        let order;
        try {
            const razorpay = new Razorpay({
                key_id: process.env.RAZORPAY_KEY_ID!,
                key_secret: process.env.RAZORPAY_KEY_SECRET!,
            });

            const options = {
                amount: serverCalculatedTotalAmount * 100,
                currency: 'INR',
                receipt: bookingRef.id,
                notes: {
                    bookingId: bookingRef.id,
                    uid: uid,
                }
            };

            order = await Promise.race([
                razorpay.orders.create(options),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Razorpay order creation timeout')), API_TIMEOUT_MS)
                )
            ]);

            // Update booking with Razorpay order ID
            await bookingRef.update({
                'payment.orderId': order.id,
                'payment.status': 'created',
                'payment.createdAt': FieldValue.serverTimestamp(),
            });

            logPaymentTransaction('initiated', bookingRef.id, {
                userId: uid,
                paymentId: order.id,
                amount: serverCalculatedTotalAmount
            });

        } catch (razorpayError: any) {
            console.error("Razorpay order creation failed, rolling back Firestore changes:", razorpayError);
            logPaymentTransaction('failed', bookingRef.id, {
                userId: uid,
                error: `Razorpay error: ${razorpayError.message}`
            });
            
            // Cleanup: Delete the pending booking and associated slots
            await db.runTransaction(async (rollbackTx) => {
                rollbackTx.delete(bookingRef);
                tempSlotIds.forEach(id => rollbackTx.delete(db.collection('slots').doc(id)));
            });
            
            throw razorpayError;
        }

        return createSuccessResponse(
            {
                success: true,
                orderId: order.id,
                bookingId: bookingRef.id,
                amount: order.amount
            },
            200
        );

    } catch (error: any) {
        console.error("Error creating booking:", error);
        logPaymentTransaction('failed', bookingRef.id, {
            userId: uid,
            error: error.message || 'Booking creation failed'
        });
        
        return createErrorResponse(
            error.message || 'Failed to create booking. Please try again.',
            500,
            'BOOKING_ERROR'
        );
    }
}
