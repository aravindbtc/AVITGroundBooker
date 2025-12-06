
"use client"
import { useState } from 'react';
import { Dashboard } from '@/components/dashboard/dashboard';
import type { BookingItem } from '@/lib/types';
import { startOfDay } from 'date-fns';

export default function Home() {
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [bookingAddons, setBookingAddons] = useState<BookingItem[]>([]);

  const handleBookingSuccess = () => {
    setSelectedSlots([]);
    setBookingAddons([]);
  };

  return (
    <div className="space-y-8">
      <Dashboard
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        selectedSlots={selectedSlots}
        onSlotsChange={setSelectedSlots}
        bookingAddons={bookingAddons}
        onAddonsChange={setBookingAddons}
        onBookingSuccess={handleBookingSuccess}
      />
    </div>
  );
}
