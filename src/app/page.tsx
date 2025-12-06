
"use client"
import { AddonsBooking } from '@/components/dashboard/addons-booking';
import { VenueInfo } from '@/components/dashboard/venue-info';
import { LoyaltyStatus } from '@/components/dashboard/loyalty-status';
import { BookingFlow } from '@/components/dashboard/booking-flow';
import { RecentBookings } from '@/components/dashboard/recent-bookings';
import { VenueGrid } from '@/components/dashboard/venue-grid';
import { Dashboard } from '@/components/dashboard/dashboard';

export default function Home() {

  return (
    <div className="space-y-8">
      <Dashboard />
    </div>
  );
}
