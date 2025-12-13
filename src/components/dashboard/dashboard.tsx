
'use client';
import { useState, useEffect, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { FlexibleTimeSlotSelection } from './time-slot-selection';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import type { BookingItem, Slot } from '@/lib/types';
import { query, collection, where, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { AddonsBooking } from './addons-booking';
import { VenueInfo } from './venue-info';
import { cn } from '@/lib/utils';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ShoppingCart } from 'lucide-react';
import { useRouter } from 'next/navigation';

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

export function Dashboard() {
  const { user } = useUser();
  const router = useRouter();
  const [date, setDate] = useState(new Date());
  const [selectedSlots, setSelectedSlots] = useState<Slot[]>([]);
  const [bookingAddons, setBookingAddons] = useState<BookingItem[]>([]);
  const { data: slots, isLoading } = useSlots(date);
  
  const cartItemsCount = selectedSlots.length + bookingAddons.reduce((acc, item) => acc + item.quantity, 0);

  const handleGoToCart = () => {
    // Stringify data to pass in URL query params
    const cartData = {
        slots: selectedSlots.map(s => ({
            startAt: s.startAt.toISOString(),
            endAt: s.endAt.toISOString(),
            durationMins: s.durationMins,
            price: s.price, // Will be recalculated on server
        })),
        addons: bookingAddons,
    };
    const query = encodeURIComponent(JSON.stringify(cartData));
    router.push(`/cart?data=${query}`);
  }

  if (isLoading) return <div className="text-center p-10">Loading slots...</div>;
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
        <Card className="p-4">
            <h2 className="text-lg font-semibold font-headline mb-2 text-center">Select Date</h2>
            <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} className="rounded-md border mx-auto" />
        </Card>
        <Card>
            <CardContent className="p-4">
                <h2 className="text-lg font-semibold font-headline mb-2">Select Time for {format(date, 'PPP')}</h2>
                <FlexibleTimeSlotSelection 
                    slots={slots || []} 
                    selectedSlots={selectedSlots} 
                    onSelect={setSelectedSlots}
                    date={date}
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
