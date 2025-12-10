
import type { Timestamp } from 'firebase/firestore';

export type UserProfile = {
  id: string;
  uid: string;
  email: string;
  fullName: string;
  contact?: string;
  address?: string;
  profilePic?: string;
  collegeId?: string;
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
  dateString: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
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
    location: string;
    pricePerHour: number;
    capacity: number;
    timings: string[];
    images: string[];
    isAvailable: boolean;
    description: string;
    rating: number;
};

export type BookingItem = {
    id: string;
    name: string;
    quantity: number;
    price: number;
    type: 'slot' | 'item' | 'manpower';
}
