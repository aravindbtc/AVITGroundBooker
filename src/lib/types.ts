
import type { Timestamp } from 'firebase/firestore';

export type UserProfile = {
  id: string;
  uid: string;
  email: string;
  fullName: string;
  collegeId?: string;
  phone?: string;
  role: 'user' | 'admin';
  loyaltyPoints: number;
  createdAt: Timestamp;
  profilePic?: string;
};

export type Slot = {
  id?: string;
  startAt: Date | Timestamp; // Can be Date on client, Timestamp in Firestore
  endAt: Date | Timestamp;
  durationMins?: number;
  status: 'available' | 'booked' | 'pending' | 'blocked';
  price: number;
  date?: Date | Timestamp; // For queries
  groundId?: string;
  dateString?: string;
  startTime?: string;
  endTime?: string;
  isPeak?: boolean;
  bookingId?: string | null;
  addons?: Array<{ id: string; name: string; quantity: number, price: number, type: 'item' | 'manpower', contact?: string }>;
};


export type Booking = {
  id: string;
  uid: string;
  slots: string[]; // Ref paths
  addons?: Array<{ id: string; name: string; quantity: number, price: number, type: 'item' | 'manpower', contact?: string }>;
  totalAmount: number;
  status: 'pending' | 'paid' | 'cancelled' | 'failed';
  createdAt?: Date | Timestamp;
  groundId?: string;
  date?: string;
  payment: {
      orderId?: string;
      razorpayPaymentId?: string;
      status: 'pending' | 'created' | 'paid' | 'failed';
      createdAt: Timestamp;
      capturedAt?: Timestamp;
  };
};

export type Accessory = {
  id: string;
  name: string;
  price: number;
  stock: number;
  type: 'item' | 'manpower';
  contact?: string;
}

export type Venue = {
  id?: string;
  fullName: string;
  address: string;
  contact: {
      primary: string; // For the "Call Venue" button
      secondary: string; // For admissions or other purposes
      email: string;
  };
  googleMapsUrl?: string;
  basePrice: number;
  morningPrice?: number;
  afternoonPrice?: number;
  eveningPrice?: number;
  rating: number;
  images: string[];
};


export type BookingItem = {
    id: string;
    name: string;
    quantity: number;
    price: number;
    type: 'slot' | 'item' | 'manpower';
    contact?: string;
}

export type Rating = {
  id?: string;
  bookingId: string;
  userId: string;
  ratedItemId: string; // e.g., 'avit-ground', 'bat', 'umpire'
  ratedItemType: 'ground' | 'item' | 'manpower';
  rating: number; // 1-5
  comment?: string;
  createdAt: Timestamp;
}
