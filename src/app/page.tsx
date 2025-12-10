
'use client';

import { useUser } from '@/firebase';
import { Dashboard } from '@/components/dashboard/dashboard';
import { HeroSection } from '@/components/landing/hero-section';
import { FeaturedGrounds } from '@/components/landing/featured-grounds';
import { WhyBookWithUs } from '@/components/landing/why-book-with-us';
import { Testimonials } from '@/components/landing/testimonials';
import { Footer } from '@/components/footer';
import { useState } from 'react';
import type { BookingItem } from '@/lib/types';
import { startOfDay } from 'date-fns';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [bookingAddons, setBookingAddons] = useState<BookingItem[]>([]);

  const handleBookingSuccess = () => {
    setSelectedSlots([]);
    setBookingAddons([]);
  };

  if (isUserLoading) {
    // You can return a loading spinner here if you want
    return <div className="h-screen w-full flex items-center justify-center">Loading...</div>;
  }
  
  if (!user) {
    return (
        <div className="bg-white text-gray-800">
            <main>
                <HeroSection />
                <FeaturedGrounds />
                <WhyBookWithUs />
                <Testimonials />
            </main>
        </div>
    )
  }

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
