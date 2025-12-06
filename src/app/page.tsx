
"use client"
import { useState } from 'react';
import { SearchHeader } from '@/components/dashboard/search-header';
import { AddonsBooking } from '@/components/dashboard/addons-booking';
import { VenueInfo } from '@/components/dashboard/venue-info';
import { LoyaltyStatus } from '@/components/dashboard/loyalty-status';
import { RecentBookings } from '@/components/dashboard/recent-bookings';
import { TimeSlotSelection } from '@/components/dashboard/time-slot-selection';

export default function Home() {
  const [showTimeSlots, setShowTimeSlots] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const handleFindAvailability = () => {
    setShowTimeSlots(true);
  };

  return (
    <div className="space-y-8">
      <SearchHeader 
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onFindAvailability={handleFindAvailability} 
      />
      {showTimeSlots && selectedDate && <TimeSlotSelection selectedDate={selectedDate} />}
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
