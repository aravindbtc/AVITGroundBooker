
'use client';
import { Button } from '@/components/ui/button';
import { Clock, Sun, Sunset, Sunrise, Sparkles, CalendarX, TrendingUp } from 'lucide-react';
import type { Slot, Venue } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';

interface Props {
  slots: Slot[];
  selectedSlots: Slot[];
  onSelect: (slots: Slot[]) => void;
  date: Date;
  venue: Venue | null;
}

const TIME_BLOCKS = [
    {
        name: 'Morning',
        icon: <Sunrise className="h-5 w-5" />,
        slots: [
            { id: '06-08', label: '6am - 8am', startHour: 6, endHour: 8 },
            { id: '08-10', label: '8am - 10am', startHour: 8, endHour: 10 },
            { id: '10-12', label: '10am - 12pm', startHour: 10, endHour: 12 },
        ]
    },
    {
        name: 'Afternoon',
        icon: <Sun className="h-5 w-5" />,
        slots: [
            { id: '12-14', label: '12pm - 2pm', startHour: 12, endHour: 14 },
            { id: '14-16', label: '2pm - 4pm', startHour: 14, endHour: 16 },
            { id: '16-18', label: '4pm - 6pm', startHour: 16, endHour: 18 },
        ]
    },
    {
        name: 'Evening',
        icon: <Sunset className="h-5 w-5" />,
        slots: [
            { id: '18-20', label: '6pm - 8pm', startHour: 18, endHour: 20 },
            { id: '20-22', label: '8pm - 10pm', startHour: 20, endHour: 22 },
        ]
    }
];

export function FlexibleTimeSlotSelection({ slots: existingSlots, selectedSlots, onSelect, date, venue }: Props) {
    
    const getPriceForSlot = (startHour: number): number => {
        if (!venue) return 0;
        const duration = 1; // Price is per hour
        
        if (startHour >= 6 && startHour < 12) { // Morning
            return (venue.morningPrice || venue.basePrice) * duration;
        }
        if (startHour >= 12 && startHour < 18) { // Afternoon
            return (venue.afternoonPrice || venue.basePrice) * duration;
        }
        if (startHour >= 18 && startHour < 22) { // Evening
            return (venue.eveningPrice || venue.basePrice * 1.2) * duration;
        }
        return venue.basePrice * duration; // Fallback
    };
    
    const isSlotBooked = (startHour: number, endHour: number) => {
        const slotStart = new Date(date);
        slotStart.setHours(startHour, 0, 0, 0);

        const slotEnd = new Date(date);
        slotEnd.setHours(endHour, 0, 0, 0);

        return existingSlots.some(bookedSlot => {
            const bookedStart = new Date(bookedSlot.startAt);
            const bookedEnd = new Date(bookedSlot.endAt);
            return slotStart < bookedEnd && slotEnd > bookedStart;
        });
    };
    
    const isSlotSelected = (slotId: string) => {
        return selectedSlots.some(s => s.id === slotId);
    }
    
    const handleToggleSlot = (slotInfo: typeof TIME_BLOCKS[0]['slots'][0]) => {
        if (isSlotBooked(slotInfo.startHour, slotInfo.endHour)) return;

        const slotId = `${date.toISOString().split('T')[0]}-${slotInfo.id}`;
        
        if (isSlotSelected(slotId)) {
            onSelect(selectedSlots.filter(s => s.id !== slotId));
        } else {
             const startAt = new Date(date);
             startAt.setHours(slotInfo.startHour, 0, 0, 0);
             const endAt = new Date(date);
             endAt.setHours(slotInfo.endHour, 0, 0, 0);

             const newSlot: Omit<Slot, 'id'> & { id: string } = {
                 id: slotId,
                 startAt,
                 endAt,
                 status: 'available',
                 price: getPriceForSlot(slotInfo.startHour) * 2, // 2-hour slots
                 dateString: date.toISOString().split('T')[0],
             }
             onSelect([...selectedSlots, newSlot].sort((a,b) => (a.startAt as Date).getTime() - (b.startAt as Date).getTime()));
        }
    }

  return (
    <div className="space-y-8">
      {existingSlots.length === 0 ? (
        <Alert className="border-amber-200 bg-amber-50">
          <CalendarX className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-900 ml-2">
            <div className="font-semibold mb-1">No Slots Available</div>
            <div className="text-sm">
              Unfortunately, there are no available slots for {date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}. 
              Please try selecting a different date or contact the venue for availability.
            </div>
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {TIME_BLOCKS.map(block => (
            <div key={block.name} className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-blue-100 to-green-100 rounded-lg">
                  {block.icon}
                </div>
                <h3 className="font-headline text-lg font-bold text-slate-800">
                  {block.name}
                </h3>
                <span className="text-xs text-slate-500 ml-auto">
                  {block.slots.filter(s => !isSlotBooked(s.startHour, s.endHour)).length} available
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {block.slots.map(slot => {
                  const isBooked = isSlotBooked(slot.startHour, slot.endHour);
                  const isSelected = isSlotSelected(`${date.toISOString().split('T')[0]}-${slot.id}`);
                  const isPeak = slot.startHour >= 18;
                  const price = getPriceForSlot(slot.startHour) * 2;

                  return (
                    <button
                      key={slot.id}
                      onClick={() => handleToggleSlot(slot)}
                      disabled={isBooked}
                      className={cn(
                        "relative overflow-hidden rounded-xl p-4 transition-all duration-300 text-left border-2",
                        {
                          // Selected state - gradient background with shadow
                          "bg-gradient-to-br from-blue-600 to-blue-700 text-white border-blue-700 shadow-lg scale-105": isSelected,
                          // Booked state - disabled appearance
                          "bg-gradient-to-br from-red-50 to-red-100 text-red-600 border-red-300 cursor-not-allowed opacity-60": isBooked,
                          // Available state with peak pricing
                          "bg-white hover:bg-gradient-to-br hover:from-green-50 hover:to-green-100 border-gray-200 text-slate-700 cursor-pointer hover:border-green-400 hover:shadow-md": !isBooked && !isSelected && isPeak,
                          // Available state normal
                          "bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100 border-gray-200 text-slate-700 cursor-pointer hover:border-blue-400 hover:shadow-md": !isBooked && !isSelected && !isPeak,
                        }
                      )}
                    >
                      {/* Background decoration */}
                      <div className={cn(
                        "absolute top-0 right-0 w-20 h-20 rounded-full blur-xl opacity-30 transition-all duration-300",
                        {
                          "bg-blue-400": isSelected,
                          "bg-red-400": isBooked,
                          "bg-green-400": isPeak && !isBooked,
                          "bg-blue-300": !isPeak && !isBooked,
                        }
                      )} />

                      {/* Content */}
                      <div className="relative z-10 space-y-2">
                        <div className="flex items-center justify-between">
                          <Clock className="h-5 w-5 opacity-70" />
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-white" />
                            </div>
                          )}
                        </div>
                        <div className="pt-2">
                          <div className="font-bold text-base leading-tight">
                            {slot.label}
                          </div>
                          <div className={cn(
                            "text-sm font-semibold mt-1",
                            isBooked ? "text-red-600" : isSelected ? "text-blue-100" : "text-slate-600"
                          )}>
                            {isBooked ? 'Booked' : `₹${price}`}
                          </div>
                        </div>
                      </div>

                      {/* Peak Badge */}
                      {isPeak && !isBooked && (
                        <div className={cn(
                          "absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all duration-300",
                          isSelected ? "bg-white/30 text-white" : "bg-gradient-to-r from-amber-400 to-red-400 text-white shadow-md"
                        )}>
                          <TrendingUp className="h-3 w-3" />
                          Peak
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

    