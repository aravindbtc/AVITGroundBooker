
"use client"
import { AddonsBooking } from '@/components/dashboard/addons-booking';
import { VenueInfo } from '@/components/dashboard/venue-info';
import { LoyaltyStatus } from '@/components/dashboard/loyalty-status';
import { BookingFlow } from '@/components/dashboard/booking-flow';
import { RecentBookings } from '@/components/dashboard/recent-bookings';
import { VenueGrid } from '@/components/dashboard/venue-grid';

export default function Home() {

  return (
    <div className="space-y-8">
      <BookingFlow />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <VenueGrid />
          <AddonsBooking />
        </div>
        <div className="space-y-8">
          <VenueInfo />
          <LoyaltyStatus />
          <RecentBookings />
        </div>
      </div>
    </div>
  );
}
