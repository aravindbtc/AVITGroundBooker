"use client";
import { AddonsBooking } from "./addons-booking";
import { BookingCalendar } from "./booking-calendar";
import { LoyaltyStatus } from "./loyalty-status";
import { RecentBookings } from "./recent-bookings";
import { VenueInfo } from "./venue-info";
import { WeatherReschedule } from "./weather-reschedule";

export function Dashboard() {
  return (
    <div className="flex flex-col gap-8">
        <BookingCalendar />
        <AddonsBooking />
        <VenueInfo />
        <LoyaltyStatus />
        <RecentBookings />
        <WeatherReschedule />
    </div>
  );
}
