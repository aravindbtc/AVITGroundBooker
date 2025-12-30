
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import Razorpay from 'razorpay';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

export const dynamic = "force-dynamic";

const PENDING_BOOKING_EXPIRY_MINUTES = 10;

// Initialize Razorpay with server-side environment variables
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});


export async function POST(req: Request) {
    try {
        const db = getAdminDb();
        const { slots, addons = [], totalAmount, user } = await req.json();

        if (!user || !user.uid) {
            return NextResponse.json({ success: false, error: 'Authentication is required.' }, { status: 401 });
        }
        
        if (!slots || !Array.isArray(slots) || slots.length === 0) {
            return NextResponse.json({ success: false, error: 'Slot information is required.' }, { status: 400 });
        }
        if (!totalAmount || typeof totalAmount !== 'number' || totalAmount <= 0) {
            return NextResponse.json({ success: false, error: 'A valid total amount is required.' }, { status: 400 });
        }

        const bookingDateString = new Date(slots[0].startAt).toISOString().split('T')[0];
        const manpowerAddons = addons.filter((a: any) => a.type === 'manpower');
        const bookingRef = db.collection('bookings').doc(); // Create a new booking ID
        const tempSlotIds: string[] = [];
    
        // 1. Create Razorpay order FIRST. We use its ID as our receipt.
        const options = {
            amount: totalAmount * 100, // Amount in paise
            currency: 'INR',
            receipt: bookingRef.id, // Use our Firestore booking ID as the receipt
            notes: {
                bookingId: bookingRef.id,
                uid: user.uid,
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
                uid: user.uid,
                groundId: 'avit-ground',
                date: bookingDateString,
                slots: tempSlotIds,
                addons: addons,
                totalAmount: totalAmount,
                status: 'pending',
                createdAt: FieldValue.serverTimestamp(),
                expiresAt: Timestamp.fromDate(expiresAt),
                payment: {
                    orderId: order.id,
                    status: 'created',
                    createdAt: FieldValue.serverTimestamp(),
                },
            });
        });

        return NextResponse.json({ success: true, orderId: order.id, bookingId: bookingRef.id, amount: order.amount });

    } catch (error: any) {
        console.error("Error creating Razorpay order:", error);
        return NextResponse.json({ success: false, error: error.message || 'Failed to create booking intent.' }, { status: 500 });
    }
}
