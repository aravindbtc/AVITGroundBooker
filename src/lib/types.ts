
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
};

export type Slot = {
  id?: string;
  startAt: Date | Timestamp; // Can be Date on client, Timestamp in Firestore
  endAt: Date | Timestamp;
  durationMins: number; // NEW: Flexible duration
  status: 'available' | 'booked' | 'pending' | 'rejected' | 'maintenance'; // Extended
  price: number;
  proposerUID?: string; // NEW: For custom proposals
  approverUID?: string;
  notes?: string;
  date: Date | Timestamp; // For queries
  groundId?: string;
  dateString?: string;
  startTime?: string;
  endTime?: string;
  isPeak?: boolean;
  bookingId?: string | null;
};


export type Booking = {
  id?: string;
  uid: string; // Changed from userUID for consistency
  slots: string[]; // Ref paths
  addons?: Array<{ itemId: string; quantity: number }>;
  totalAmount: number;
  status: 'pending' | 'paid' | 'approved' | 'rejected' | 'pending_approval' | 'cancelled' | 'failed'; // NEW: For proposals
  razorpayOrderID?: string;
  createdAt?: Date | Timestamp;
  groundId?: string;
  date?: string;
  payment?: {
      orderId: string;
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
}

export type Venue = {
  id?: string;
  fullName: string;
  address: string;
  contact: {
      general: string;
      admissions: string;
      email: string;
  };
  gps: {
      lat: number;
      lng: number;
  };
  basePrice: number;
  rating: number;
  images: string[];
};


export type BookingItem = {
    id: string;
    name: string;
    quantity: number;
    price: number;
    type: 'slot' | 'item' | 'manpower';
}

    