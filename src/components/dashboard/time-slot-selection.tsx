
'use client';
import { Button } from '@/components/ui/button';
import { Clock, Sun, Sunset, Sunrise, Sparkles } from 'lucide-react';
import type { Slot } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';

interface Props {
  slots: Slot[];
  selectedSlots: Slot[];
  onSelect: (slots: Slot[]) => void;
  date: Date;
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

export function FlexibleTimeSlotSelection({ slots: existingSlots, selectedSlots, onSelect, date }: Props) {
    
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

             const newSlot: Slot = {
                 id: slotId,
                 startAt,
                 endAt,
                 durationMins: (endAt.getTime() - startAt.getTime()) / 60000,
                 status: 'available',
                 price: 0, // Price to be calculated by server
                 date: date,
             }
             onSelect([...selectedSlots, newSlot].sort((a,b) => a.startAt.getTime() - b.startAt.getTime()));
        }
    }

  return (
    <div className="space-y-6">
      {TIME_BLOCKS.map(block => (
        <div key={block.name}>
            <h3 className="flex items-center gap-2 font-headline text-lg mb-3">
                {block.icon}
                {block.name}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {block.slots.map(slot => {
                    const isBooked = isSlotBooked(slot.startHour, slot.endHour);
                    const isSelected = isSlotSelected(`${date.toISOString().split('T')[0]}-${slot.id}`);
                    const isPeak = slot.startHour >= 17;

                    return (
                        <Button
                            key={slot.id}
                            variant={isSelected ? 'default' : 'outline'}
                            onClick={() => handleToggleSlot(slot)}
                            disabled={isBooked}
                            className={cn(
                                "h-16 flex-col items-center justify-center gap-1 text-base relative",
                                {
                                    "bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-not-allowed": isBooked,
                                    "border-primary border-2": isSelected,
                                    "dark:border-primary-foreground": isSelected && block.name === 'Evening', // Example of further customization
                                }
                            )}
                        >
                            <span className="font-bold">{slot.label}</span>
                            {isBooked ? (
                                <Badge variant="secondary" className="text-xs">Booked</Badge>
                            ) : isPeak && (
                                <Badge variant="destructive" className="text-xs absolute -top-2 -right-2 p-1 leading-none">
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    Peak
                                </Badge>
                            )}
                        </Button>
                    )
                })}
            </div>
        </div>
      ))}
    </div>
  );
}
