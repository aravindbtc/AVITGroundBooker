
"use client";
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Clock, Zap, Sun, Moon, Sparkles, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from '@/lib/utils';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import type { Slot } from '@/lib/types';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Skeleton } from '../ui/skeleton';
import { Card, CardFooter } from '../ui/card';

type TimeSlotSelectionProps = {
    selectedDate: Date;
};

export function TimeSlotSelection({ selectedDate }: TimeSlotSelectionProps) {
    const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
    const firestore = useFirestore();

    const slotsQuery = useMemoFirebase(() => {
        if (!firestore || !selectedDate) return null;
        
        // **FIX:** Format the date to a string to match the 'dateString' field in Firestore.
        const dateString = format(selectedDate, 'yyyy-MM-dd');
        return query(collection(firestore, 'slots'), where('dateString', '==', dateString));

    }, [firestore, selectedDate]);

    const { data: timeSlots, isLoading } = useCollection<Slot>(slotsQuery);

    const handleSlotClick = (slotId: string, isBooked: boolean) => {
        if (isBooked) return;
        setSelectedSlots(prev =>
            prev.includes(slotId)
                ? prev.filter(id => id !== slotId)
                : [...prev, slotId]
        );
    };
    
    const handleConfirmSlots = () => {
        if (!firestore) return;
        selectedSlots.forEach(slotId => {
            const slotRef = doc(firestore, 'slots', slotId);
            // Non-blocking update to Firestore
            setDocumentNonBlocking(slotRef, { status: 'booked' }, { merge: true });
        });
        setSelectedSlots([]);
    };

    const sortedSlots = timeSlots?.sort((a,b) => a.startTime.localeCompare(b.startTime));
    const morningSlots = sortedSlots?.filter(s => parseInt(s.startTime) < 12);
    const afternoonSlots = sortedSlots?.filter(s => parseInt(s.startTime) >= 12 && parseInt(s.startTime) < 17);
    const eveningSlots = sortedSlots?.filter(s => parseInt(s.startTime) >= 17);
    
    const totalHours = selectedSlots.length;
    // TODO: Get price from venue data
    const pricePerHour = 500;
    const peakHourSurcharge = 150;
    const totalPrice = selectedSlots.reduce((total, slotId) => {
        const slot = timeSlots?.find(s => s.id === slotId);
        return total + pricePerHour + (slot?.isPeak ? peakHourSurcharge : 0);
    }, 0);

    const renderSlotButtons = (slots: Slot[] | undefined) => {
        if (!slots || slots.length === 0) {
             return <p className="col-span-full text-muted-foreground text-sm p-4 text-center">No slots available for this period.</p>
        }
        return slots.map(slot => (
            <Button
                key={slot.id}
                variant={selectedSlots.includes(slot.id) ? "default" : "outline"}
                disabled={slot.status === 'booked'}
                onClick={() => handleSlotClick(slot.id, slot.status === 'booked')}
                className={cn("relative h-12 text-xs md:text-sm transition-all duration-200", 
                    { 'ring-2 ring-primary ring-offset-2': selectedSlots.includes(slot.id),
                      'bg-muted hover:bg-muted text-muted-foreground/60 cursor-not-allowed line-through': slot.status === 'booked'
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
                        {Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                    </div>
                </div>
                 <div className="space-y-3">
                    <h3 className="font-semibold text-lg flex items-center gap-2"><Sparkles className="text-sky-500" /> Afternoon</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                        {Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                    </div>
                </div>
                 <div className="space-y-3">
                    <h3 className="font-semibold text-lg flex items-center gap-2"><Moon className="text-indigo-500" /> Evening</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                        {Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-6">
                <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
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

             {totalPrice > 0 && (
                <div className="mt-6 sticky bottom-0">
                    <CardFooter className="flex flex-col sm:flex-row items-center justify-between mt-4 bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-sm p-4 rounded-xl border shadow-lg gap-4">
                        <div>
                            <span className="text-xl font-bold font-headline">Total: RS.{totalPrice.toFixed(2)}</span>
                            <p className="text-sm text-muted-foreground">For {totalHours} hour(s) of ground booking</p>
                        </div>
                        <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold w-full sm:w-auto shadow-md" onClick={handleConfirmSlots}>
                            <CheckCircle2 className="mr-2 h-5 w-5" />
                            Confirm Slots
                        </Button>
                    </CardFooter>
                </div>
            )}
        </>
    );
}
