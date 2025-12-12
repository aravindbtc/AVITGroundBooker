
'use client';
import { useState, useEffect, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar'; // ShadCN
import { FlexibleTimeSlotSelection } from './time-slot-selection';
import { BookingSummary } from './booking-summary';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import type { BookingItem, Slot } from '@/lib/types';
import { query, collection, where, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { AddonsBooking } from './addons-booking';
import { VenueInfo } from './venue-info';

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


// ProposeModal: Simple form with DateTimePickers
function ProposeModal({ date, onClose, onPropose, existingSlots }: { date: Date; onClose: () => void; onPropose: (slot: Slot) => void, existingSlots: Slot[] }) {
  const [start, setStart] = useState(new Date(new Date(date).setHours(9,0,0,0)));
  const [end, setEnd] = useState(new Date(new Date(date).setHours(10,0,0,0))); 
  const {toast} = useToast();

  const handlePropose = () => {
    const duration = (end.getTime() - start.getTime()) / (1000 * 60);
    if (duration < 30 || duration > 240) {
      toast({
        variant: "destructive",
        title: "Invalid Duration",
        description: "Slot duration must be between 30 and 240 minutes."
      });
      return;
    }
    if (end <= start) {
        toast({
            variant: "destructive",
            title: "Invalid Time",
            description: "End time must be after start time."
        });
        return;
    }

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

    onPropose({ 
        startAt: start, 
        endAt: end, 
        durationMins: duration, 
        status: 'available', // Directly bookable
        price: 0, // Server will calculate
      });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <Card className="p-6 w-full max-w-md space-y-4">
        <h3 className="font-headline text-lg mb-4">Propose Custom Time Slot</h3>
        <div className="space-y-2">
            <label className="text-sm font-medium">Start Time</label>
            <input type="datetime-local" defaultValue={start.toISOString().slice(0,16)} onChange={e => setStart(new Date(e.target.value))} className="w-full p-2 border rounded-md bg-background"/>
        </div>
        <div className="space-y-2">
            <label className="text-sm font-medium">End Time</label>
            <input type="datetime-local" defaultValue={end.toISOString().slice(0,16)} onChange={e => setEnd(new Date(e.target.value))} className="w-full p-2 border rounded-md bg-background"/>
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
  const [date, setDate] = useState(new Date());
  const [selectedSlots, setSelectedSlots] = useState<Slot[]>([]);
  const [bookingAddons, setBookingAddons] = useState<BookingItem[]>([]);
  const [showProposeModal, setShowProposeModal] = useState(false);
  const { data: slots, isLoading } = useSlots(date);

  const handleBookingSuccess = () => {
    setSelectedSlots([]);
    setBookingAddons([]);
  };

  if (isLoading) return <div className="text-center p-10">Loading slots...</div>;
  if (!user) return <div>Please login.</div>

  const allItems: BookingItem[] = [
    ...selectedSlots.map(s => ({...s, id: new Date(s.startAt).getTime().toString(), name: `Slot`, type: 'slot' as const, quantity: 1})),
    ...bookingAddons,
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-2 space-y-8">
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
      </div>
      <div className="md:col-span-1">
          {selectedSlots.length > 0 && 
            <div className="sticky top-24">
                <BookingSummary slots={selectedSlots} addons={bookingAddons} onBookingSuccess={handleBookingSuccess} />
            </div>
          }
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
