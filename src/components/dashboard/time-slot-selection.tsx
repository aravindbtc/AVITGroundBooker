
"use client";
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Zap, Sun, Moon, Sparkles, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from '@/lib/utils';

// Mock data for slots - in a real app, this would come from your backend
const timeSlots = Array.from({ length: 17 }, (_, i) => {
    const hour = 5 + i;
    const isBooked = Math.random() > 0.7; // 30% chance of being booked
    const isPeak = hour >= 16 && hour < 20; // 4 PM to 8 PM
    return {
        id: `slot-${hour}`,
        startTime: `${hour.toString().padStart(2, '0')}:00`,
        endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
        isBooked,
        isPeak,
    };
});

type TimeSlotSelectionProps = {
    selectedDate: Date;
};

export function TimeSlotSelection({ selectedDate }: TimeSlotSelectionProps) {
    const [selectedSlots, setSelectedSlots] = useState<string[]>([]);

    const handleSlotClick = (slotId: string, isBooked: boolean) => {
        if (isBooked) return;
        setSelectedSlots(prev =>
            prev.includes(slotId)
                ? prev.filter(id => id !== slotId)
                : [...prev, slotId]
        );
    };

    const morningSlots = timeSlots.filter(s => parseInt(s.startTime) < 12);
    const afternoonSlots = timeSlots.filter(s => parseInt(s.startTime) >= 12 && parseInt(s.startTime) < 17);
    const eveningSlots = timeSlots.filter(s => parseInt(s.startTime) >= 17);
    
    const totalHours = selectedSlots.length;
    const pricePerHour = 500;
    const peakHourSurcharge = 150;
    const totalPrice = selectedSlots.reduce((total, slotId) => {
        const slot = timeSlots.find(s => s.id === slotId);
        return total + pricePerHour + (slot?.isPeak ? peakHourSurcharge : 0);
    }, 0);


    return (
        <Card className="shadow-lg rounded-xl w-full">
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-3">
                    <Clock className="h-6 w-6 text-primary" />
                    Select Time Slots for {format(selectedDate, "PPP")}
                </CardTitle>
                 <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-card border border-primary"></div><span>Available</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-muted"></div><span>Booked</span></div>
                    <div className="flex items-center gap-2"><Zap className="h-4 w-4 text-accent" /><span>Peak Hour (+RS.{peakHourSurcharge})</span></div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-3">
                    <h3 className="font-semibold text-lg flex items-center gap-2"><Sun className="text-amber-500" /> Morning</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                        {morningSlots.map(slot => (
                            <Button
                                key={slot.id}
                                variant={selectedSlots.includes(slot.id) ? "default" : "outline"}
                                disabled={slot.isBooked}
                                onClick={() => handleSlotClick(slot.id, slot.isBooked)}
                                className={cn("relative h-12 text-xs md:text-sm", { 'ring-2 ring-primary': selectedSlots.includes(slot.id) })}
                            >
                                {slot.isPeak && <Zap className="absolute top-1 right-1 h-3 w-3 text-accent fill-current" />}
                                {slot.startTime}
                            </Button>
                        ))}
                    </div>
                </div>
                 <div className="space-y-3">
                    <h3 className="font-semibold text-lg flex items-center gap-2"><Sparkles className="text-sky-500" /> Afternoon</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                        {afternoonSlots.map(slot => (
                            <Button
                                key={slot.id}
                                variant={selectedSlots.includes(slot.id) ? "default" : "default"}
                                disabled={slot.isBooked}
                                onClick={() => handleSlotClick(slot.id, slot.isBooked)}
                                className={cn("relative h-12 text-xs md:text-sm", { 'bg-primary/20 hover:bg-primary/30 text-primary-foreground border-primary': !selectedSlots.includes(slot.id) && !slot.isBooked,  'ring-2 ring-offset-2 ring-primary': selectedSlots.includes(slot.id) })}
                            >
                                {slot.isPeak && <Zap className="absolute top-1 right-1 h-3 w-3 text-accent fill-current" />}
                                {slot.startTime}
                            </Button>
                        ))}
                    </div>
                </div>
                 <div className="space-y-3">
                    <h3 className="font-semibold text-lg flex items-center gap-2"><Moon className="text-indigo-500" /> Evening</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                        {eveningSlots.map(slot => (
                             <Button
                                key={slot.id}
                                variant={selectedSlots.includes(slot.id) ? "default" : "default"}
                                disabled={slot.isBooked}
                                onClick={() => handleSlotClick(slot.id, slot.isBooked)}
                                className={cn("relative h-12 text-xs md:text-sm", { 'bg-primary/20 hover:bg-primary/30 text-primary-foreground border-primary': !selectedSlots.includes(slot.id) && !slot.isBooked, 'ring-2 ring-offset-2 ring-primary': selectedSlots.includes(slot.id)})}
                            >
                                {slot.isPeak && <Zap className="absolute top-1 right-1 h-3 w-3 text-accent fill-current" />}
                                {slot.startTime}
                            </Button>
                        ))}
                    </div>
                </div>
            </CardContent>

             {totalPrice > 0 && (
                <CardFooter className="flex flex-col sm:flex-row items-center justify-between mt-4 bg-slate-50 -mx-6 -mb-6 p-6 gap-4">
                    <div>
                        <span className="text-xl font-bold font-headline">Total: RS.{totalPrice.toFixed(2)}</span>
                        <p className="text-sm text-muted-foreground">For {totalHours} hour(s) of ground booking</p>
                    </div>
                    <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold w-full sm:w-auto">
                        <CheckCircle2 className="mr-2 h-5 w-5" />
                        Confirm Slots
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}
