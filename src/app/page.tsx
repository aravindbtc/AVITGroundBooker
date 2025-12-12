
'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { Dashboard } from '@/components/dashboard/dashboard';
import { HeroSection } from '@/components/landing/hero-section';
import { FeaturedGrounds } from '@/components/landing/featured-grounds';
import { WhyBookWithUs } from '@/components/landing/why-book-with-us';
import { Testimonials } from '@/components/landing/testimonials';
import { Footer } from '@/components/footer';
import { useState } from 'react';
import type { BookingItem, Venue } from '@/lib/types';
import { startOfDay } from 'date-fns';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

function LandingPage() {
    const firestore = useFirestore();
    const venueRef = useMemoFirebase(() => firestore && doc(firestore, 'venue', 'avit-ground'), [firestore]);
    const { data: venue, isLoading } = useDoc<Venue>(venueRef);

    if (isLoading || !venue) {
        return (
            <div className="bg-white text-gray-800">
                <main>
                    <div className="h-screen w-full flex items-center justify-center">
                        <Skeleton className="h-full w-full" />
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="bg-white text-gray-800">
            <main>
                <HeroSection venue={venue} />
                <FeaturedGrounds venue={venue} />
                <WhyBookWithUs />
                <Testimonials />
            </main>
        </div>
    )
}


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
    return (
        <div className="flex justify-center items-center" style={{height: 'calc(100vh - 8rem)'}}>
            <div className="text-center">
                Loading App...
            </div>
        </div>
    );
  }
  
  if (!user) {
    return <LandingPage />;
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
