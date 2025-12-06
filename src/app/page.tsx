"use client"
import { SearchHeader } from '@/components/dashboard/search-header';
import { SportSelector } from '@/components/dashboard/sport-selector';
import { VenueGrid } from '@/components/dashboard/venue-grid';
import { LoyaltyStatus } from '@/components/dashboard/loyalty-status';
import { RecentBookings } from '@/components/dashboard/recent-bookings';
import { Separator } from '@/components/ui/separator';

export default function Home() {
  return (
    <div className="space-y-8">
      <SearchHeader />
      <SportSelector />
      <Separator />
      <VenueGrid />
      <LoyaltyStatus />
      <RecentBookings />
    </div>
  );
}
