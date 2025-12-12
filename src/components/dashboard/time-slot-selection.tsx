
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Zap } from 'lucide-react';
import type { Slot } from '@/lib/types'; // Updated type
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';

interface Props {
  slots: Slot[];
  selectedSlots: Slot[];
  onSelect: (slots: Slot[]) => void;
  onPropose: () => void;
  date: Date;
}

export function FlexibleTimeSlotSelection({ slots, selectedSlots, onSelect, onPropose, date }: Props) {
  const [hoveredGap, setHoveredGap] = useState<{ start: Date; end: Date } | null>(null);
  const { toast } = useToast();
  const { user } = useUser();

  const handlePropose = async (proposal: { start: Date; end: Date; durationMins: number }) => {
      if (!user) {
          toast({ variant: 'destructive', title: "Authentication required" });
          return;
      }
      try {
          const functions = getFunctions();
          const proposeCustomSlot = httpsCallable(functions, 'proposeCustomSlot');
          const result: any = await proposeCustomSlot({ date, ...proposal });

          // Add optimistic pending slot
          onSelect([...selectedSlots, { 
              ...proposal, 
              id: result.data.slotId, 
              status: 'pending', 
              price: result.data.price,
              proposerUID: user.uid,
              date: proposal.start,
            }]);
          toast({ title: "Proposal Submitted", description: "Your custom slot request has been sent for admin approval."});
      } catch (error: any) {
          toast({ variant: 'destructive', title: "Proposal Failed", description: error.message || "Could not submit proposal." });
      }
  };

  // Sort slots by start time, find gaps for proposals
  const sortedSlots = [...slots].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  const gaps: { start: Date; end: Date }[] = [];
  let prevEnd = new Date(date);
  prevEnd.setHours(5, 0, 0, 0); // Ground opens 5AM

  sortedSlots.forEach(slot => {
    const start = new Date(slot.startAt);
    if (start > prevEnd) {
      gaps.push({ start: prevEnd, end: start });
    }
    prevEnd = new Date(Math.max(prevEnd.getTime(), new Date(slot.endAt).getTime()));
  });

  // Add end-of-day gap
  const endOfDay = new Date(date);
  endOfDay.setHours(22, 0, 0, 0); // Closes 10PM
  if (prevEnd < endOfDay) {
    gaps.push({ start: prevEnd, end: endOfDay });
  }


  const toggleSlot = (slot: Slot) => {
    if (slot.status === 'available') {
      const isSelected = selectedSlots.some(s => s.id === slot.id);
      onSelect(isSelected ? selectedSlots.filter(s => s.id !== slot.id) : [...selectedSlots, slot]);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-2 font-headline"><Clock /> Time Slots</h3>
      <div className="h-96 overflow-y-auto border rounded-lg p-2 space-y-2 bg-slate-50 dark:bg-slate-900"> {/* Timeline container */}
        {sortedSlots.map(slot => (
          <div key={slot.id} className={`flex items-center p-2 border-l-4 rounded-r-md bg-white dark:bg-black ${
            slot.status === 'available' ? 'border-green-500 cursor-pointer hover:bg-green-50' : 
            slot.status === 'pending' ? 'border-yellow-500' : 'border-red-500'
          }`} onClick={() => toggleSlot(slot)}>
            <Badge variant={slot.status === 'available' ? 'default' : 'secondary'}>
              {new Date(slot.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(slot.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Badge>
            {new Date(slot.startAt).getHours() > 17 && <Zap className="w-4 h-4 text-yellow-500 ml-auto" />} {/* Peak */}
            <span className="ml-2 font-semibold">Rs.{slot.price}</span>
            {slot.status === 'pending' && <span className="ml-2 text-yellow-600 font-medium">Pending Approval</span>}
             {selectedSlots.some(s => s.id === slot.id) && <span className="ml-auto text-green-600 font-bold">Selected</span>}
          </div>
        ))}
        {/* Gaps for proposals */}
        {gaps.map((gap, i) => (
          <div key={`gap-${i}`} className="p-2 bg-gray-100 dark:bg-gray-800 border-dashed border-y cursor-pointer hover:bg-gray-200" 
               onMouseEnter={() => setHoveredGap(gap)} onClick={onPropose}>
            <p className="text-sm text-center text-muted-foreground">Free: {gap.start.toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })} - {gap.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            {hoveredGap === gap && (
              <div className="text-center mt-2">
                <Button size="sm" onClick={(e) => { 
                    e.stopPropagation(); 
                    handlePropose({ start: gap.start, end: new Date(gap.start.getTime() + 60*60*1000), durationMins: 60 }); 
                }}>
                    Propose Here (1hr)
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
      <Button onClick={onPropose} variant="outline" className="w-full">Propose a Custom Time Slot</Button>
    </div>
  );
}
