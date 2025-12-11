
'use client';
import { useState, useEffect, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar'; // ShadCN
import { FlexibleTimeSlotSelection } from './time-slot-selection';
import { BookingSummary } from './booking-summary';
import { useUser, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import type { Slot } from '@/lib/types';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

function useSlots(date: Date) {
    const firestore = useFirestore();
    const [slots, setSlots] = useState<Slot[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const dateString = useMemo(() => format(date, 'yyyy-MM-dd'), [date]);

    useEffect(() => {
        if (!firestore) return;
        setIsLoading(true);
        const q = query(collection(firestore, 'venues/cricket/slots'), where('dateString', '==', dateString));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedSlots = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                startAt: doc.data().startAt.toDate(),
                endAt: doc.data().endAt.toDate(),
            })) as Slot[];
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


function overlaps(s1: Slot, s2: Slot) {
  const start1 = new Date(s1.startAt);
  const end1 = new Date(s1.endAt);
  const start2 = new Date(s2.startAt);
  const end2 = new Date(s2.endAt);
  return !(end1 <= start2 || end2 <= start1);
}

// ProposeModal: Simple form with DateTimePickers (use react-datepicker or ShadCN)
function ProposeModal({ date, onClose, onPropose }: { date: Date; onClose: () => void; onPropose: (slot: Slot) => void }) {
  const [start, setStart] = useState(date);
  const [end, setEnd] = useState(new Date(date.getTime() + 60 * 60 * 1000)); // 1hr default
  const duration = (end.getTime() - start.getTime()) / (1000 * 60);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="p-4 w-full max-w-md">
        <h3 className="font-headline text-lg mb-4">Propose Custom Slot</h3>
        <div className="space-y-4">
            <div>
                <label className="text-sm font-medium">Start Time</label>
                <input type="datetime-local" value={start.toISOString().slice(0,16)} onChange={e => setStart(new Date(e.target.value))} className="w-full p-2 border rounded-md"/>
            </div>
            <div>
                <label className="text-sm font-medium">End Time</label>
                <input type="datetime-local" value={end.toISOString().slice(0,16)} onChange={e => setEnd(new Date(e.target.value))} className="w-full p-2 border rounded-md"/>
            </div>
        </div>
        <p className="text-sm text-muted-foreground mt-2">Duration: {duration} mins (Min 30, Max 120)</p>
        <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => {
            if (duration < 30 || duration > 120) return alert('Invalid duration');
            onPropose({ 
                startAt: start, 
                endAt: end, 
                durationMins: duration, 
                status: 'pending' as const,
                date: start, // for querying
                price: 0, // server will calculate
             });
            onClose();
            }}>Propose</Button>
        </div>
      </Card>
    </div>
  );
}

export function Dashboard() {
  const { user } = useUser();
  const { toast } = useToast();
  const [date, setDate] = useState(new Date());
  const [selectedSlots, setSelectedSlots] = useState<Slot[]>([]);
  const [showProposeModal, setShowProposeModal] = useState(false);
  const { data: slots, isLoading } = useSlots(date); // Realtime fetch

  useEffect(() => {
    // Realtime conflict check on snapshot
    if (slots) {
      const conflicts = selectedSlots.filter(s => 
        !s.id && // only check un-saved proposals
        slots.find(existing => overlaps(s, existing))
      );
      if (conflicts.length > 0) {
        toast({
            variant: "destructive",
            title: 'Conflicts detected!',
            description: 'Some of your proposed slots overlap with new bookings. Please review.'
        });
        setSelectedSlots(prev => prev.filter(s => !conflicts.some(c => c.startAt === s.startAt)));
      }
    }
  }, [slots, selectedSlots, toast]);

  if (isLoading) return <div>Loading slots...</div>; // Skeleton
  if (!user) return <div>Please login.</div>

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} className="rounded-md border mx-auto" />
      </Card>
      <Card>
        <CardContent className="p-4">
            <h2 className="text-lg font-semibold font-headline mb-2">Available on {format(date, 'PPP')}</h2>
            <FlexibleTimeSlotSelection 
                slots={slots || []} 
                selectedSlots={selectedSlots} 
                onSelect={setSelectedSlots}
                onPropose={() => setShowProposeModal(true)}
                date={date}
            />
        </CardContent>
      </Card>

      {showProposeModal && (
        <ProposeModal 
            date={date} 
            onClose={() => setShowProposeModal(false)} 
            onPropose={(newSlot) => {
            setSelectedSlots(prev => [...prev, newSlot]);
            // Optimistic add; real propose in mutation
            }} 
        />
        )}
      {selectedSlots.length > 0 && <BookingSummary slots={selectedSlots} user={user} />}
    </div>
  );
}

    