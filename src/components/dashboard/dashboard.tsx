
'use client';
import { useState, useEffect, useMemo } from 'react';
import { FlexibleTimeSlotSelection } from './time-slot-selection';
import { useUser, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { format, addDays } from 'date-fns';
import type { BookingItem, Slot, Venue } from '@/lib/types';
import { query, collection, where, onSnapshot, doc } from 'firebase/firestore';
import { AddonsBooking } from './addons-booking';
import { VenueInfo } from './venue-info';
import { cn } from '@/lib/utils';
import { ShoppingCart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '../ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

function useSlots(date: Date) {
    const firestore = useFirestore();
    const [slots, setSlots] = useState<Slot[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const dateString = useMemoFirebase(() => format(date, 'yyyy-MM-dd'), [date]);

    useEffect(() => {
        if (!firestore) return;
        setIsLoading(true);
        const q = query(collection(firestore, 'slots'), where('dateString', '==', dateString));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedSlots = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    startAt: data.startAt?.toDate ? data.startAt.toDate() : new Date(data.startAt),
                    endAt: data.endAt?.toDate ? data.endAt.toDate() : new Date(data.endAt),
                } as Slot;
            });
            setSlots(fetchedSlots);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching slots:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [firestore, dateString]);

    return { data: slots, isLoading };
}

function DateStripPicker({ selectedDate, onDateChange }: { selectedDate: Date, onDateChange: (date: Date) => void }) {
    const today = new Date();
    const dates = Array.from({ length: 30 }).map((_, i) => addDays(today, i));

    return (
        <Card>
            <CardContent className="p-4">
                 <h2 className="text-lg font-semibold font-headline mb-4 text-center">Select Date</h2>
                <ScrollArea className="w-full whitespace-nowrap rounded-md">
                    <div className="flex w-max space-x-2 pb-4">
                        {dates.map((date, index) => (
                            <Button
                                key={index}
                                variant={format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') ? 'default' : 'outline'}
                                className="h-16 flex flex-col items-center justify-center p-2"
                                onClick={() => onDateChange(date)}
                            >
                                <span className="text-xs font-semibold">{format(date, 'EEE')}</span>
                                <span className="text-lg font-bold">{format(date, 'd')}</span>
                                <span className="text-xs">{format(date, 'MMM')}</span>
                            </Button>
                        ))}
                    </div>
                     <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

export function Dashboard() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [date, setDate] = useState(new Date());
  const [selectedSlots, setSelectedSlots] = useState<Slot[]>([]);
  const [bookingAddons, setBookingAddons] = useState<BookingItem[]>([]);
  
  const { data: slots, isLoading: isLoadingSlots } = useSlots(date);
  const venueRef = useMemoFirebase(() => firestore && doc(firestore, 'venue', 'avit-ground'), [firestore]);
  const { data: venue, isLoading: isLoadingVenue } = useDoc<Venue>(venueRef);
  
  const cartItemsCount = selectedSlots.length + bookingAddons.reduce((acc, item) => acc + item.quantity, 0);

  const handleGoToCart = () => {
    // Stringify data to pass in URL query params
    const cartData = {
        slots: selectedSlots.map(s => ({
            startAt: s.startAt.toISOString(),
            endAt: s.endAt.toISOString(),
            durationMins: s.durationMins,
            price: s.price, // Will be recalculated on server, but good for client estimate
        })),
        addons: bookingAddons,
    };
    const query = encodeURIComponent(JSON.stringify(cartData));
    router.push(`/cart?data=${query}`);
  }

  const isLoading = isLoadingSlots || isLoadingVenue;
  
  if (isLoading) return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-1 justify-center">
         <div className="space-y-8 md:col-span-1 md:max-w-4xl md:mx-auto">
             <Skeleton className="h-96 w-full" />
             <Skeleton className="h-64 w-full" />
             <Skeleton className="h-48 w-full" />
         </div>
    </div>
  );

  if (!user) return <div>Please login.</div>;


  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-8 transition-all duration-300",
        "md:grid-cols-1 justify-center"
      )}
    >
      <div
        className={cn(
          "space-y-8",
          "md:col-span-1 md:max-w-4xl md:mx-auto"
        )}
      >
        <VenueInfo />
        <DateStripPicker selectedDate={date} onDateChange={setDate} />
        <Card>
            <CardContent className="p-4">
                <h2 className="text-lg font-semibold font-headline mb-2">Select Time for {format(date, 'PPP')}</h2>
                <FlexibleTimeSlotSelection 
                    slots={slots || []} 
                    selectedSlots={selectedSlots} 
                    onSelect={setSelectedSlots}
                    date={date}
                    venue={venue}
                />
            </CardContent>
        </Card>
        <AddonsBooking bookingAddons={bookingAddons} onAddonsChange={setBookingAddons} />
        
        {cartItemsCount > 0 && (
             <div className="sticky bottom-4 z-20 w-full flex justify-center">
                 <Button size="lg" className="shadow-2xl font-bold text-lg" onClick={handleGoToCart}>
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    View Cart ({cartItemsCount} {cartItemsCount === 1 ? 'item' : 'items'})
                </Button>
            </div>
        )}
      </div>

    </div>
  );
}
