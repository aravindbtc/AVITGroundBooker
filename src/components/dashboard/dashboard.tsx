"use client";
import { AddonsBooking } from "./addons-booking";
import { BookingCalendar } from "./booking-calendar";
import { LoyaltyStatus } from "./loyalty-status";
import { RecentBookings } from "./recent-bookings";
import { VenueInfo } from "./venue-info";
import { WeatherReschedule } from "./weather-reschedule";

export function Dashboard() {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="space-y-8 lg:col-span-2">
        <BookingCalendar />
        <AddonsBooking />
        <WeatherReschedule />
      </div>
      <div className="space-y-8 lg:col-span-1">
        <VenueInfo />
        <LoyaltyStatus />
        <RecentBookings />
      </div>
    </div>
  );
}
