
"use client";
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TimeSlotSelection } from "./time-slot-selection";
import { addDays, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CalendarDays } from 'lucide-react';

function DateScroller({ selectedDate, onDateSelect }: { selectedDate: Date, onDateSelect: (date: Date) => void }) {
    const dates = Array.from({ length: 7 }).map((_, i) => addDays(new Date(), i));

    return (
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 -mx-1 px-1">
            {dates.map(date => {
                const isSelected = selectedDate.toDateString() === date.toDateString();
                return (
                    <Button 
                        key={date.toString()} 
                        variant={isSelected ? "default" : "outline"}
                        className={cn(
                            "flex flex-col h-auto p-3 rounded-lg border-2 shrink-0 w-20 transition-all duration-200",
                            isSelected && "bg-primary text-primary-foreground border-primary"
                        )}
                        onClick={() => onDateSelect(date)}
                    >
                        <span className="text-sm font-semibold">{format(date, 'E')}</span>
                        <span className="text-2xl font-bold">{format(date, 'd')}</span>
                        <span className="text-xs">{format(date, 'MMM')}</span>
                    </Button>
                )
            })}
        </div>
    )
}


export function BookingFlow() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <Card className="shadow-lg rounded-xl w-full">
        <CardHeader>
            <CardTitle className="font-headline flex items-center gap-3">
                <CalendarDays className="h-6 w-6 text-primary" />
                Book Your Slot
            </CardTitle>
            <div className="pt-4">
                 <DateScroller selectedDate={selectedDate} onDateSelect={setSelectedDate} />
            </div>
        </CardHeader>
        <CardContent>
            {selectedDate && <TimeSlotSelection selectedDate={selectedDate} />}
        </CardContent>
    </Card>
  );
}
