
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


// ProposeModal: Simple form for hourly booking proposals
function ProposeModal({ date, onClose, onPropose, existingSlots }: { date: Date; onClose: () => void; onPropose: (slot: Slot) => void, existingSlots: Slot[] }) {
  const [startHour, setStartHour] = useState<number>(9);
  const [durationHours, setDurationHours] = useState<number>(1);
  const { toast } = useToast();

  const handlePropose = () => {
    const start = new Date(date);
    start.setHours(startHour, 0, 0, 0);

    const end = new Date(start);
    end.setHours(start.getHours() + durationHours);

    // Client-side overlap check
    const hasOverlap = existingSlots.some(slot => {
        const existingStart = new Date(slot.startAt);
        const existingEnd = new Date(slot.endAt);
        return start < existingEnd && end > existingStart;
    });

    if (hasOverlap) {
        toast({
            variant: "destructive",
            title: "Slot Overlap",
            description: "Your proposed time overlaps with an existing booking. Please choose another time."
        });
        return;
    }
    
    if (start.getHours() + durationHours > 22) {
         toast({
            variant: "destructive",
            title: "Invalid Time",
            description: "Booking must end by 10:00 PM."
        });
        return;
    }

    onPropose({ 
        startAt: start, 
        endAt: end, 
        durationMins: durationHours * 60, 
        status: 'available', // Directly bookable
        price: 0, // Server will calculate
      });
    onClose();
  }
  
  // 5 AM to 9 PM (for a 1-hour slot ending at 10 PM)
  const availableHours = Array.from({length: 17}, (_, i) => i + 5);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <Card className="p-6 w-full max-w-md space-y-4">
        <h3 className="font-headline text-lg mb-4">Propose Custom Time Slot</h3>
        <div className="space-y-2">
            <Label>Start Time</Label>
            <Select onValueChange={(value) => setStartHour(parseInt(value))} defaultValue={String(startHour)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a start hour" />
              </SelectTrigger>
              <SelectContent>
                {availableHours.map(hour => (
                  <SelectItem key={hour} value={String(hour)}>
                    {`${hour % 12 === 0 ? 12 : hour % 12}:00 ${hour < 12 || hour === 24 ? 'AM' : 'PM'}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
        </div>
        <div className="space-y-2">
            <Label>Duration</Label>
             <Select onValueChange={(value) => setDurationHours(parseInt(value))} defaultValue={String(durationHours)}>
              <SelectTrigger>
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({length: 4}, (_, i) => i + 1).map(hour => (
                  <SelectItem key={hour} value={String(hour)}>
                    {hour} hour{hour > 1 ? 's' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
        </div>
        <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handlePropose}>Add Slot</Button>
        </div>
      </Card>
    </div>
  );
}

export function Dashboard() {
  const { user } = useUser();
  const router = useRouter();
  const [date, setDate] = useState(new Date());
  const [selectedSlots, setSelectedSlots] = useState<Slot[]>([]);
  const [bookingAddons, setBookingAddons] = useState<BookingItem[]>([]);
  const [showProposeModal, setShowProposeModal] = useState(false);
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
                    onPropose={() => setShowProposeModal(true)}
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

      {showProposeModal && (
        <ProposeModal 
            date={date} 
            existingSlots={slots || []}
            onClose={() => setShowProposeModal(false)} 
            onPropose={(newSlot) => {
              setSelectedSlots(prev => [...prev, newSlot]);
            }} 
        />
      )}
    </div>
  );
}
