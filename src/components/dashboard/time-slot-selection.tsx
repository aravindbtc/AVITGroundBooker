
"use client";
import { Button } from "@/components/ui/button";
import { Clock, Zap, Sun, Moon, Sparkles, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from '@/lib/utils';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import type { Slot } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';

type TimeSlotSelectionProps = {
    selectedDate: Date;
    selectedSlots: string[];
    onSlotsChange: (slots: string[]) => void;
};

export function TimeSlotSelection({ selectedDate, selectedSlots, onSlotsChange }: TimeSlotSelectionProps) {
    const firestore = useFirestore();

    const slotsQuery = useMemoFirebase(() => {
        if (!firestore || !selectedDate) return null;
        
        const dateString = format(selectedDate, 'yyyy-MM-dd');
        return query(collection(firestore, 'slots'), where('dateString', '==', dateString));

    }, [firestore, selectedDate]);

    const { data: timeSlots, isLoading } = useCollection<Slot>(slotsQuery);

    const handleSlotClick = (slotId: string, status: Slot['status']) => {
        if (status === 'booked' || status === 'blocked') return;
        onSlotsChange(
            selectedSlots.includes(slotId)
                ? selectedSlots.filter(id => id !== slotId)
                : [...selectedSlots, slotId]
        );
    };

    const sortedSlots = timeSlots?.sort((a,b) => a.startTime.localeCompare(b.startTime));
    const morningSlots = sortedSlots?.filter(s => parseInt(s.startTime) < 12);
    const afternoonSlots = sortedSlots?.filter(s => parseInt(s.startTime) >= 12 && parseInt(s.startTime) < 17);
    const eveningSlots = sortedSlots?.filter(s => parseInt(s.startTime) >= 17);

    const renderSlotButtons = (slots: Slot[] | undefined) => {
        if (!slots || slots.length === 0) {
             return <p className="col-span-full text-muted-foreground text-sm p-4 text-center">No slots available for this period.</p>
        }
        return slots.map(slot => (
            <Button
                key={slot.id}
                variant={selectedSlots.includes(slot.id) ? "default" : "outline"}
                disabled={slot.status === 'booked' || slot.status === 'blocked'}
                onClick={() => handleSlotClick(slot.id, slot.status)}
                className={cn("relative h-12 text-xs md:text-sm transition-all duration-200", 
                    { 'ring-2 ring-primary ring-offset-2': selectedSlots.includes(slot.id),
                      'bg-muted hover:bg-muted text-muted-foreground/60 cursor-not-allowed line-through': slot.status === 'booked' || slot.status === 'blocked'
                    }
                )}
            >
                {slot.isPeak && <Zap className="absolute top-1 right-1 h-3 w-3 text-accent fill-current" />}
                {slot.startTime}
            </Button>
        ));
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                 <div className="space-y-3">
                    <h3 className="font-semibold text-lg flex items-center gap-2"><Sun className="text-amber-500" /> Morning</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                        {Array.from({length: 7}).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                    </div>
                </div>
                 <div className="space-y-3">
                    <h3 className="font-semibold text-lg flex items-center gap-2"><Sparkles className="text-sky-500" /> Afternoon</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                        {Array.from({length: 5}).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                    </div>
                </div>
                 <div className="space-y-3">
                    <h3 className="font-semibold text-lg flex items-center gap-2"><Moon className="text-indigo-500" /> Evening</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                        {Array.from({length: 5}).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-2">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-card border-2 border-primary"></div><span>Available</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-primary"></div><span>Selected</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-muted line-through"></div><span>Booked</span></div>
                <div className="flex items-center gap-2"><Zap className="h-4 w-4 text-accent fill-accent" /><span>Peak Hour (+RS.150)</span></div>
            </div>

            <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2"><Sun className="text-amber-500" /> Morning</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                    {renderSlotButtons(morningSlots)}
                </div>
            </div>
             <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2"><Sparkles className="text-sky-500" /> Afternoon</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                     {renderSlotButtons(afternoonSlots)}
                </div>
            </div>
             <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2"><Moon className="text-indigo-500" /> Evening</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                    {renderSlotButtons(eveningSlots)}
                </div>
            </div>
        </div>
    );
}
