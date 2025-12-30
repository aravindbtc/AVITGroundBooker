
import { NextResponse } from 'next/server';
import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';
import Razorpay from 'razorpay';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

export const dynamic = "force-dynamic";

const PENDING_BOOKING_EXPIRY_MINUTES = 10;

export async function POST(req: Request) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        console.error("Razorpay environment variables are not configured.");
        return NextResponse.json({ success: false, error: "Payment processing is not configured on the server." }, { status: 500 });
    }

    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) {
        return NextResponse.json({ success: false, error: 'Authentication is required.' }, { status: 401 });
    }

    let uid: string;
    try {
        const decodedToken = await getAdminAuth().verifyIdToken(token);
        uid = decodedToken.uid;
    } catch (error) {
        console.error("Firebase Auth Error:", error);
        return NextResponse.json({ success: false, error: 'Invalid authentication token.' }, { status: 403 });
    }

    const db = getAdminDb();
    const bookingRef = db.collection('bookings').doc();
    const tempSlotIds: string[] = [];

    try {
        const { slots, addons = [], totalAmount } = await req.json();
        
        if (!slots || !Array.isArray(slots) || slots.length === 0) {
            return NextResponse.json({ success: false, error: 'Slot information is required.' }, { status: 400 });
        }
        if (!totalAmount || typeof totalAmount !== 'number' || totalAmount <= 0) {
            return NextResponse.json({ success: false, error: 'A valid total amount is required.' }, { status: 400 });
        }

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
                totalAmount: totalAmount,
                status: 'pending',
                createdAt: FieldValue.serverTimestamp(),
                expiresAt: Timestamp.fromDate(expiresAt),
            });
        });

        // If transaction succeeds, create the Razorpay order
        let order;
        try {
            const razorpay = new Razorpay({
                key_id: process.env.RAZORPAY_KEY_ID!,
                key_secret: process.env.RAZORPAY_KEY_SECRET!,
            });

            const options = {
                amount: totalAmount * 100, // Amount in paise
                currency: 'INR',
                receipt: bookingRef.id, // Use our Firestore booking ID as the receipt
                notes: {
                    bookingId: bookingRef.id,
                    uid: uid,
                }
            };
            order = await razorpay.orders.create(options);

            // Now, update the pending booking with the Razorpay order ID
            await bookingRef.update({
                'payment.orderId': order.id,
                'payment.status': 'created',
                'payment.createdAt': FieldValue.serverTimestamp(),
            });

        } catch (razorpayError) {
             console.error("Razorpay order creation failed, rolling back Firestore changes:", razorpayError);
             // Cleanup: Delete the pending booking and associated slots
             await db.runTransaction(async (rollbackTx) => {
                 rollbackTx.delete(bookingRef);
                 tempSlotIds.forEach(id => rollbackTx.delete(db.collection('slots').doc(id)));
             });
             throw razorpayError; // Re-throw the error to be caught by the outer catch block
        }


        return NextResponse.json({ success: true, orderId: order.id, bookingId: bookingRef.id, amount: order.amount });

    } catch (error: any) {
        console.error("Error creating booking intent:", error);
        return NextResponse.json({ success: false, error: error.message || 'Failed to create booking intent.' }, { status: 500 });
    }
}
