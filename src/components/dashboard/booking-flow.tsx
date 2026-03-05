
"use client";
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FlexibleTimeSlotSelection } from "./time-slot-selection";
import { addDays, format, isValid, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon, CalendarDays } from 'lucide-react';
import type { Slot, Venue } from '@/lib/types';

interface BookingFlowProps {
    selectedDate: Date;
    onDateChange: (date: Date) => void;
    selectedSlots: Slot[];
    onSlotsChange: (slots: Slot[]) => void;
    availableSlots: Slot[];
    venue: Venue | null;
}

export function BookingFlow({ selectedDate, onDateChange, selectedSlots, onSlotsChange, availableSlots, venue }: BookingFlowProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  const today = startOfDay(new Date());

  const handleDateSelect = (date: Date | undefined) => {
    if (date && isValid(date)) {
        onDateChange(startOfDay(date));
        setIsCalendarOpen(false);
    }
  };

  return (
    <Card className="shadow-xl rounded-xl w-full border-0 overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-green-600 text-white pb-6">
            <CardTitle className="font-headline flex items-center gap-3 text-2xl">
                <div className="bg-white/20 p-2 rounded-lg">
                  <CalendarDays className="h-6 w-6" />
                </div>
                Select Your Slots
            </CardTitle>
            <p className="text-blue-100 text-sm mt-2">Choose available time slots for your booking</p>
        </CardHeader>
        <CardContent className="pt-8 space-y-6">
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">
                    📅 Pick your date
                </label>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                                "w-full md:w-[280px] justify-start text-left font-normal h-12 border-2 transition-all duration-300",
                                !selectedDate && "text-muted-foreground",
                                isCalendarOpen && "border-blue-500 bg-blue-50"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-5 w-5 text-blue-600" />
                            {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-50">
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={handleDateSelect}
                            initialFocus
                            fromDate={today}
                            disabled={{ before: today }}
                        />
                    </PopoverContent>
                </Popover>
            </div>
            {selectedDate && (
                <div className="space-y-4">
                    <div className="bg-gradient-to-r from-blue-500/10 to-green-500/10 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-slate-600">
                            <span className="font-bold text-blue-600">Selected Date:</span> {format(selectedDate, "EEEE, MMMM d, yyyy")}
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                            ⏰ Available Time Slots
                        </label>
                        <FlexibleTimeSlotSelection 
                            slots={availableSlots}
                            selectedSlots={selectedSlots} 
                            onSelect={onSlotsChange}
                            date={selectedDate}
                            venue={venue}
                        />
                    </div>
                </div>
            )}
        </CardContent>
    </Card>
  );
}
