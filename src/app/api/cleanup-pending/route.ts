
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

export const dynamic = "force-dynamic";

/**
 * API route to clean up expired pending bookings.
 * This should be triggered by a cron job (e.g., Vercel Cron Jobs).
 * It finds bookings that are still 'pending' after their expiry time and releases the associated slots.
 */
export async function GET(req: Request) {
  // Simple security check: require a secret in the header
  // This should be set as an environment variable and passed in the cron job request
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers.get('Authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const db = getAdminDb();
  const now = Timestamp.now();
  let cleanedCount = 0;

  try {
    const expiredBookingsQuery = db.collection('bookings')
      .where('status', '==', 'pending')
      .where('expiresAt', '<', now);
      
    const snapshot = await expiredBookingsQuery.get();

    if (snapshot.empty) {
      return NextResponse.json({ success: true, message: 'No expired pending bookings found.' });
    }

    const batch = db.batch();

    for (const doc of snapshot.docs) {
      const booking = doc.data();
      
      // Mark booking as 'failed' or 'expired'
      batch.update(doc.ref, { status: 'failed', 'payment.status': 'expired' });

      // Delete the associated temporary slots to release them
      if (Array.isArray(booking.slots)) {
        booking.slots.forEach((slotId: string) => {
          const slotRef = db.collection('slots').doc(slotId);
          batch.delete(slotRef);
        });
      }
      cleanedCount++;
    }

    await batch.commit();

    return NextResponse.json({ success: true, message: `Cleaned up ${cleanedCount} expired bookings.` });

  } catch (error: any) {
    console.error("Error cleaning up pending bookings:", error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to clean up expired bookings.' }, { status: 500 });
  }
}
