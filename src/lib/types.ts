import type { Timestamp } from 'firebase/firestore';

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  phone?: string;
  collegeId: string;
  role: 'user' | 'admin';
  loyaltyPoints: number;
};

export type Booking = {
  id: string;
  userId: string;
  bookingDate: Timestamp;
  paymentTimestamp?: Timestamp;
  total: number;
  status: 'pending' | 'paid' | 'confirmed' | 'cancelled';
  slotIds: string[];
  addons: BookingItem[];
  razorpayOrderId?: string;
};

export type Addon = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export type Manpower = {
  id: string;
  name: string;
  price: number;
  availability: boolean;
};

export type Slot = {
  id: string;
  startTime: string;
  endTime: string;
  isPeak: boolean;
  status: 'available' | 'booked';
  date: Timestamp;
  dateString: string;
  bookedById?: string;
};

export type Venue = {
    id: string;
    fullName: string;
    address: string;
    gps: {
        lat: number;
        lng: number;
    };
    contact: {
        general: string;
        admissions: string;
        email: string;
    };
    rating: number;
    basePrice: number;
}

export type BookingItem = {
    id: string;
    name: string;
    quantity: number;
    price: number;
    type: 'slot' | 'addon' | 'manpower';
}

    