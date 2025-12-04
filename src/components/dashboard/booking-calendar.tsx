"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button }from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { addDays, format, isSameDay } from "date-fns";
import { Clock, Zap } from "lucide-react";
import { Separator } from "@/components/ui/separator";

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
    <Card className="shadow-lg rounded-xl">
      <CardHeader>
        <CardTitle className="font-headline text-3xl flex items-center gap-2">
            <Clock className="h-8 w-8"/>
            Book Your Slot
        </CardTitle>
        <CardDescription>Select a date and time to reserve the cricket ground.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        <div className="flex justify-center">
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
          <h3 className="font-semibold text-lg font-headline">
            Available Slots for {date ? format(date, "PPP") : "..."}
          </h3>
          <Separator />
          {todaysSlots.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {todaysSlots.map((slot) => (
                <Button
                  key={slot}
                  variant={selectedSlot === slot ? "default" : "outline"}
                  onClick={() => setSelectedSlot(slot)}
                  className="relative h-12 text-base"
                >
                  {slot}
                  {peakHours.includes(slot) && (
                     <Badge className="absolute -top-2 -right-2 scale-90 bg-amber-500 text-white font-bold border-2 border-background">
                        <Zap className="h-3 w-3 mr-1"/>
                        Peak
                     </Badge>
                  )}
                </Button>
              ))}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center rounded-md border-2 border-dashed py-10">
              <p className="text-lg text-muted-foreground">No slots available.</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between -mx-6 -mb-6 p-6 bg-slate-50 mt-6">
        <div>
            {selectedSlot && date ? (
                <p className="text-md font-medium">
                    Selected: <span className="text-primary font-bold">{format(date, "MMM d, yyyy")}</span> at <span className="text-primary font-bold">{selectedSlot}</span>
                </p>
            ) : (
                <p className="text-md text-muted-foreground">Please select a slot to continue.</p>
            )}
        </div>
        <Button disabled={!selectedSlot} size="lg" className="font-bold text-lg bg-accent hover:bg-accent/90 text-accent-foreground">
          Proceed to Book
        </Button>
      </CardFooter>
    </Card>
  );
}
