
import type { Timestamp } from 'firebase/firestore';

export type UserProfile = {
  id: string;
  email: string;
  fullName: string;
  collegeId: string;
  phone?: string;
  role: 'user' | 'admin';
  loyaltyPoints: number;
  createdAt: Timestamp;
};

export type Booking = {
  id: string;
  uid: string;
  groundId: string;
  date: string;
  slots: string[];
  addons: BookingItem[];
  totalAmount: number;
  payment: {
      orderId: string;
      razorpayPaymentId?: string;
      status: 'pending' | 'created' | 'paid' | 'failed';
      createdAt: Timestamp;
      capturedAt?: Timestamp;
  };
  status: 'pending' | 'paid' | 'cancelled' | 'failed';
  createdAt: Timestamp;
};

export type Addon = {
  id: string;
  name: string;
  price: number;
  stock: number;
  type: 'item';
};

export type Manpower = {
  id: string;
  name: string;
  price: number;
  stock: number; // Represents availability, e.g., 2 umpires available
  type: 'manpower';
};

export type Slot = {
  id: string;
  groundId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  startAt: Timestamp;
  endAt: Timestamp;
  price: number;
  isPeak: boolean;
  status: 'available' | 'booked' | 'blocked';
  bookingId: string | null;
};

export type Venue = {
    id: string;
    name: string;
    address: string;
    phone: string;
    gps: {
        lat: number;
        lng: number;
    };
    basePricePerHour: number;
    images: string[];
};

export type BookingItem = {
    id: string;
    name: string;
    quantity: number;
    price: number;
    type: 'slot' | 'item' | 'manpower';
}
