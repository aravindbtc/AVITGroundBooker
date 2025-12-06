
"use client";
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TimeSlotSelection } from "./time-slot-selection";
import { addDays, format, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon, CalendarDays } from 'lucide-react';

export function BookingFlow() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  const today = new Date();
  const nextMonth = addDays(new Date(), 30);

  const handleDateSelect = (date: Date | undefined) => {
    if (date && isValid(date)) {
        setSelectedDate(date);
        setIsCalendarOpen(false); // Close calendar on date select
    }
  };

  return (
    <Card className="shadow-lg rounded-xl w-full">
        <CardHeader>
            <CardTitle className="font-headline flex items-center gap-3">
                <CalendarDays className="h-6 w-6 text-primary" />
                Book Your Slot
            </CardTitle>
             <div className="pt-4">
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                                "w-[280px] justify-start text-left font-normal",
                                !selectedDate && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={handleDateSelect}
                            initialFocus
                            fromDate={today}
                            toDate={nextMonth}
                            disabled={{ before: today }}
                        />
                    </PopoverContent>
                </Popover>
            </div>
        </CardHeader>
        <CardContent>
            {selectedDate && <TimeSlotSelection selectedDate={selectedDate} />}
        </CardContent>
    </Card>
  );
}
