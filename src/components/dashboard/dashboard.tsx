
"use client";
import { AddonsBooking } from "./addons-booking";
import { LoyaltyStatus } from "./loyalty-status";
import { RecentBookings } from "./recent-bookings";
import { VenueInfo } from "./venue-info";
import { SportSelector } from "./sport-selector";
import { VenueGrid } from "./venue-grid";
import { Separator } from "../ui/separator";

export function Dashboard() {
  return (
    <div className="flex flex-col gap-8">
        <SportSelector />
        <Separator />
        <VenueGrid />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <AddonsBooking />
                <VenueInfo />
            </div>
            <div className="space-y-8">
                <LoyaltyStatus />
                <RecentBookings />
            </div>
        </div>
    </div>
  );
}
