
'use client';
import { Button } from '@/components/ui/button';
import { Clock, Sun, Sunset, Sunrise } from 'lucide-react';
import type { Slot } from '@/lib/types';

interface Props {
  slots: Slot[];
  selectedSlots: Slot[];
  onSelect: (slots: Slot[]) => void;
  date: Date;
}

const PREDEFINED_SLOTS = [
    { id: 'morning', name: 'Morning', startHour: 8, endHour: 12, icon: <Sunrise /> },
    { id: 'afternoon', name: 'Afternoon', startHour: 13, endHour: 17, icon: <Sun /> },
    { id: 'evening', name: 'Evening', startHour: 18, endHour: 22, icon: <Sunset /> },
]

export function FlexibleTimeSlotSelection({ slots: existingSlots, selectedSlots, onSelect, date }: Props) {
    const isSlotBooked = (startHour: number, endHour: number) => {
        const slotStart = new Date(date);
        slotStart.setHours(startHour, 0, 0, 0);

        const slotEnd = new Date(date);
        slotEnd.setHours(endHour, 0, 0, 0);

        return existingSlots.some(bookedSlot => {
            const bookedStart = new Date(bookedSlot.startAt);
            const bookedEnd = new Date(bookedSlot.endAt);
            // Check for any overlap
            return slotStart < bookedEnd && slotEnd > bookedStart;
        });
    };
    
    const isSlotSelected = (slotId: string) => {
        return selectedSlots.some(s => s.id === slotId);
    }
    
    const handleToggleSlot = (slotInfo: typeof PREDEFINED_SLOTS[0]) => {
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
             onSelect([...selectedSlots, newSlot]);
        }
    }

  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-2 font-headline"><Clock /> Select a Block</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {PREDEFINED_SLOTS.map((slot) => {
            const isBooked = isSlotBooked(slot.startHour, slot.endHour);
            const isSelected = isSlotSelected(`${date.toISOString().split('T')[0]}-${slot.id}`);
            return (
                <Button
                    key={slot.id}
                    variant={isSelected ? 'default' : 'outline'}
                    onClick={() => handleToggleSlot(slot)}
                    disabled={isBooked}
                    className="h-24 flex flex-col items-center justify-center gap-2 text-base"
                >
                    <div className="flex items-center gap-2">
                        {slot.icon}
                        <span className="font-bold">{slot.name}</span>
                    </div>
                     <span className="text-sm">
                        {`${slot.startHour % 12 || 12}:00 ${slot.startHour < 12 ? 'AM' : 'PM'} - ${slot.endHour % 12 || 12}:00 ${slot.endHour < 12 ? 'AM' : 'PM'}`}
                    </span>
                    {isBooked && <span className="text-xs text-destructive-foreground">(Booked)</span>}
                </Button>
            );
        })}
      </div>
    </div>
  );
}
