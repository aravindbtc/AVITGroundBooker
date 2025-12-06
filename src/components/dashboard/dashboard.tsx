
"use client";
import { AddonsBooking } from "./addons-booking";
import { LoyaltyStatus } from "./loyalty-status";
import { RecentBookings } from "./recent-bookings";
import { VenueInfo } from "./venue-info";
import { SportSelector } from "./sport-selector";
import { VenueGrid } from "./venue-grid";
import { Separator } from "../ui/separator";
import { BookingFlow } from "./booking-flow";
import { BookingSummary } from "./booking-summary";
import type { BookingItem, Slot } from "@/lib/types";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";

interface DashboardProps {
    selectedDate: Date;
    onDateChange: (date: Date) => void;
    selectedSlots: string[];
    onSlotsChange: (slots: string[]) => void;
    bookingAddons: BookingItem[];
    onAddonsChange: (addons: BookingItem[]) => void;
    onBookingSuccess: () => void;
}

export function Dashboard({
    selectedDate,
    onDateChange,
    selectedSlots,
    onSlotsChange,
    bookingAddons,
    onAddonsChange,
    onBookingSuccess
}: DashboardProps) {

  const firestore = useFirestore();
  const slotsQuery = useMemoFirebase(() => {
    if (!firestore || selectedSlots.length === 0) return null;
    // Firestore 'in' queries are limited to 30 items. 
    // If you expect users to book more, this would need batching.
    return query(collection(firestore, 'slots'), where('id', 'in', selectedSlots));
  }, [firestore, selectedSlots]);

  const { data: slotDetails } = useCollection<Slot>(slotsQuery);

  return (
    <div className="flex flex-col gap-8">
        <SportSelector />
        <Separator />
        <BookingFlow 
            selectedDate={selectedDate}
            onDateChange={onDateChange}
            selectedSlots={selectedSlots}
            onSlotsChange={onSlotsChange}
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                 <AddonsBooking 
                    bookingAddons={bookingAddons}
                    onAddonsChange={onAddonsChange}
                 />
            </div>
            <div className="space-y-8">
                <LoyaltyStatus />
                <RecentBookings />
            </div>
        </div>
        <VenueGrid />
        <VenueInfo />
        
        {(selectedSlots.length > 0 || bookingAddons.length > 0) && (
            <BookingSummary 
                slotDetails={slotDetails ?? []}
                bookingAddons={bookingAddons}
                onBookingSuccess={onBookingSuccess}
            />
        )}
    </div>
  );
}
