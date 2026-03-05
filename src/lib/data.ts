import type { User, Booking, Addon, Manpower } from '@/lib/types';
import { Hammer, Orbit, Shield, Award, ToyBrick, Megaphone, User as UserIcon } from 'lucide-react';

export const mockUser: User = {
  name: 'Guest User',
  email: 'guest@avit.ac.in',
  avatarUrl: '',
  collegeId: 'AVT00000',
  loyalty: {
    points: 0,
    tier: 'Bronze',
  },
};

export const mockBookings: Booking[] = [
  // Mock data is removed to avoid confusion. Real data will be fetched from Firestore.
];

export const mockAddons: Addon[] = [
  { id: 'bat', name: 'Cricket Bat', price: 150, stock: 5, icon: Hammer },
  { id: 'ball', name: 'Leather Ball', price: 50, stock: 20, icon: Orbit },
  { id: 'stumps', name: 'Stumps', price: 75, stock: 15, icon: ToyBrick },
  { id: 'helmet', name: 'Helmet', price: 100, stock: 10, icon: Shield },
  { id: 'pads', name: 'Pads & Gloves', price: 120, stock: 10, icon: Award },
];

export const mockManpower: Manpower[] = [
    { id: 'umpire', name: 'Umpire', price: 300, stock: 2, icon: Megaphone },
    { id: 'coach', name: 'Coach', price: 500, stock: 2, icon: UserIcon },
];

export const avit_details = {
    fullName: "Aarupadai Veedu Institute of Technology (AVIT)",
    address: "Vinayaka Nagar, Rajiv Gandhi Salai (Old Mahabalipuram Road), Paiyanoor, Chennai - 603 104, Tamil Nadu, India.",
    gps: { lat: 12.788057, lng: 80.246541 },
    contact: {
        general: "+91 73052 88895",
        admissions: "+91 80150 11156",
        email: "admissions@avit.ac.in",
        info: "info@avit.ac.in",
    },
    rating: 4.5,
    basePrice: 500
};
