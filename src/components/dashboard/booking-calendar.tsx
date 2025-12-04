"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { addDays, format, isSameDay } from "date-fns";
import { Clock } from "lucide-react";

// Mock data for slots
const availableSlots = [
  { date: new Date(), slots: ["07:00", "08:00", "16:00", "19:00", "20:00"] },
  { date: addDays(new Date(), 1), slots: ["09:00", "10:00", "17:00", "18:00", "21:00"] },
  { date: addDays(new Date(), 3), slots: ["07:00", "11:00", "15:00", "16:00", "20:00"] },
  { date: addDays(new Date(), 4), slots: ["08:00", "12:00"] },
];
const peakHours = ["16:00", "17:00", "18:00", "19:00", "20:00"];

export function BookingCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const handleDateChange = (newDate: Date | undefined) => {
    setDate(newDate);
    setSelectedSlot(null);
  };
  
  const todaysSlots = date ? availableSlots.find(day => isSameDay(day.date, date))?.slots || [] : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
            <Clock />
            Book a Slot
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        <div>
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateChange}
            className="rounded-md border"
            disabled={(day) => day < new Date(new Date().toDateString())}
            modifiers={{
              available: availableSlots.map(s => s.date)
            }}
            modifiersClassNames={{
              available: 'bg-primary/20'
            }}
          />
        </div>
        <div className="space-y-4">
          <h3 className="font-semibold">
            Available Slots for {date ? format(date, "PPP") : "..."}
          </h3>
          {todaysSlots.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {todaysSlots.map((slot) => (
                <Button
                  key={slot}
                  variant={selectedSlot === slot ? "default" : "outline"}
                  onClick={() => setSelectedSlot(slot)}
                  className="relative"
                >
                  {slot}
                  {peakHours.includes(slot) && (
                     <Badge variant="destructive" className="absolute -top-2 -right-2 scale-75 border-2 border-background">Peak</Badge>
                  )}
                </Button>
              ))}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center rounded-md border border-dashed py-10">
              <p className="text-sm text-muted-foreground">No slots available for this day.</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
            {selectedSlot && date && (
                <p className="text-sm font-medium">
                    Selected: <span className="text-primary">{format(date, "MMM d, yyyy")}</span> at <span className="text-primary">{selectedSlot}</span>
                </p>
            )}
        </div>
        <Button disabled={!selectedSlot}>
          Proceed to Book
        </Button>
      </CardFooter>
    </Card>
  );
}
