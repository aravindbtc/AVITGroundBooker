"use client";
import { AddonsBooking } from "./addons-booking";
import { LoyaltyStatus } from "./loyalty-status";
import { RecentBookings } from "./recent-bookings";
import { VenueInfo } from "./venue-info";
import { SearchHeader } from "./search-header";
import { SportSelector } from "./sport-selector";
import { VenueGrid } from "./venue-grid";
import { Separator } from "../ui/separator";

export function Dashboard() {
  return (
    <div className="flex flex-col gap-8">
        <SearchHeader />
        <SportSelector />
        <Separator />
        <VenueGrid />
        <AddonsBooking />
        <VenueInfo />
        <LoyaltyStatus />
        <Recent-bookings />
    </div>
  );
}
