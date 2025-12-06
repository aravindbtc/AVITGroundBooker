"use client"
import { SearchHeader } from '@/components/dashboard/search-header';
import { AddonsBooking } from '@/components/dashboard/addons-booking';
import { VenueInfo } from '@/components/dashboard/venue-info';
import { LoyaltyStatus } from '@/components/dashboard/loyalty-status';
import { RecentBookings } from '@/components/dashboard/recent-bookings';
import { Separator } from '@/components/ui/separator';

export default function Home() {
  return (
    <div className="space-y-8">
      <SearchHeader />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <AddonsBooking />
          <VenueInfo />
        </div>
        <div className="space-y-8">
          <LoyaltyStatus />
          <RecentBookings />
        </div>
      </div>
    </div>
  );
}
