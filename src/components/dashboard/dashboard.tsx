
'use client';
import { useState, useEffect, useMemo } from 'react';
import { useUser, useFirestore, useMemoFirebase, useDoc, useCollection } from '@/firebase';
import type { BookingItem, Slot, Venue } from '@/lib/types';
import { query, collection, where, onSnapshot, doc, Timestamp } from 'firebase/firestore';
import { AddonsBooking } from './addons-booking';
import { VenueInfo } from './venue-info';
import { cn } from '@/lib/utils';
import { ShoppingCart, CheckCircle2, Clock, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '../ui/skeleton';
import { BookingFlow } from './booking-flow';
import { Button } from '../ui/button';

function useAllBookedSlotsForManpower() {
    const firestore = useFirestore();
    const [slots, setSlots] = useState<Slot[]>([]);

    useEffect(() => {
        if (!firestore) return;
        
        const q = query(
            collection(firestore, 'slots'), 
            where('status', '==', 'booked')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
             const fetchedSlots = snapshot.docs.map(doc => {
                const data = doc.data();
                // Fetch bookings that have manpower
                if (data.addons && data.addons.some((a: any) => a.type === 'manpower')) {
                    return {
                        id: doc.id,
                        ...data,
                        startAt: data.startAt instanceof Timestamp ? data.startAt.toDate() : new Date(data.startAt),
                        endAt: data.endAt instanceof Timestamp ? data.endAt.toDate() : new Date(data.endAt),
                    } as Slot;
                }
                return null;
            }).filter((s): s is Slot => s !== null);
            
            setSlots(fetchedSlots);
        });

        return () => unsubscribe();
    }, [firestore]);

    return { data: slots };
}


export function Dashboard() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [date, setDate] = useState(new Date());
  const [selectedSlots, setSelectedSlots] = useState<Slot[]>([]);
  const [bookingAddons, setBookingAddons] = useState<BookingItem[]>([]);
  
  const slotsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    const dateString = date.toISOString().split('T')[0];
    return query(collection(firestore, 'slots'), where('dateString', '==', dateString));
  }, [firestore, date]);
  
  const { data: slots, isLoading: isLoadingSlots } = useCollection<Slot>(slotsQuery);
  const { data: allBookedSlotsForManpower } = useAllBookedSlotsForManpower();

  const venueRef = useMemoFirebase(() => firestore && doc(firestore, 'venue', 'avit-ground'), [firestore]);
  const { data: venue, isLoading: isLoadingVenue } = useDoc<Venue>(venueRef);
  
  const cartItemsCount = selectedSlots.length + bookingAddons.reduce((acc, item) => acc + item.quantity, 0);

  const handleGoToCart = () => {
    // Stringify data to pass in URL query params
    const cartData = {
        slots: selectedSlots.map(s => ({
            ...s,
            startAt: s.startAt.toISOString(),
            endAt: s.endAt.toISOString(),
        })),
        addons: bookingAddons,
    };
    const query = encodeURIComponent(JSON.stringify(cartData));
    router.push(`/cart?data=${query}`);
  }

  const isLoading = isLoadingSlots || isLoadingVenue;
  
  if (isLoading && !venue) return (
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
        "w-full max-w-4xl mx-auto px-4 space-y-8 transition-all duration-300"
      )}
    >
      {/* Step Indicator */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-center justify-between md:justify-start md:gap-8">
          {/* Step 1: Select Slots */}
          <div className="flex flex-col items-center gap-2">
            <div className={cn(
              "rounded-full p-3 transition-all duration-300",
              selectedSlots.length > 0 
                ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg" 
                : "bg-white border-2 border-blue-200 text-blue-600"
            )}>
              <Clock className="h-5 w-5" />
            </div>
            <span className="text-xs md:text-sm font-semibold text-center text-slate-700">Slots</span>
            {selectedSlots.length > 0 && <span className="text-xs text-blue-600 font-bold">{selectedSlots.length}</span>}
          </div>

          {/* Connector Line */}
          <div className="flex-1 h-1 mx-2 md:mx-4 bg-gradient-to-r from-blue-200 to-green-200 rounded hidden md:block" />

          {/* Step 2: Select Addons */}
          <div className="flex flex-col items-center gap-2">
            <div className={cn(
              "rounded-full p-3 transition-all duration-300",
              bookingAddons.length > 0 && selectedSlots.length > 0
                ? "bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg" 
                : "bg-white border-2 border-gray-200 text-slate-400"
            )}>
              <Zap className="h-5 w-5" />
            </div>
            <span className="text-xs md:text-sm font-semibold text-center text-slate-700">Addons</span>
            {bookingAddons.length > 0 && <span className="text-xs text-green-600 font-bold">{bookingAddons.length}</span>}
          </div>

          {/* Connector Line */}
          <div className="flex-1 h-1 mx-2 md:mx-4 bg-gradient-to-r from-green-200 to-purple-200 rounded hidden md:block" />

          {/* Step 3: Checkout */}
          <div className="flex flex-col items-center gap-2">
            <div className={cn(
              "rounded-full p-3 transition-all duration-300",
              cartItemsCount > 0
                ? "bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg" 
                : "bg-white border-2 border-gray-200 text-slate-400"
            )}>
              <ShoppingCart className="h-5 w-5" />
            </div>
            <span className="text-xs md:text-sm font-semibold text-center text-slate-700">Checkout</span>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <VenueInfo />
        <BookingFlow
            selectedDate={date}
            onDateChange={setDate}
            selectedSlots={selectedSlots}
            onSlotsChange={setSelectedSlots}
            availableSlots={slots || []}
            venue={venue}
        />
        <AddonsBooking 
            bookingAddons={bookingAddons} 
            onAddonsChange={setBookingAddons}
            selectedDate={date}
            bookedSlots={allBookedSlotsForManpower || []}
        />
        
        {cartItemsCount > 0 && (
             <div className="fixed bottom-4 left-0 right-0 px-4 z-50 flex justify-center lg:static">
                 <Button 
                   size="lg" 
                   className="shadow-2xl font-bold text-lg w-full lg:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-300" 
                   onClick={handleGoToCart}
                 >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    View Cart ({cartItemsCount} {cartItemsCount === 1 ? 'item' : 'items'})
                </Button>
            </div>
        )}
      </div>

    </div>
  );
}

    