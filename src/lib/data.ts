import type { User, Booking, Addon, Manpower } from '@/lib/types';
import { Hammer, Baseball, Shield, Award, ToyBrick, Whistle, User as UserIcon } from 'lucide-react';

export const mockUser: User = {
  name: 'Alex Johnson',
  email: 'alex.j@avit.ac.in',
  avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
  collegeId: 'AVT12345',
  loyalty: {
    points: 780,
    tier: 'Gold',
  },
};

export const mockBookings: Booking[] = [
  {
    id: 'BK001',
    date: new Date(new Date().setDate(new Date().getDate() - 2)),
    startTime: '16:00',
    endTime: '18:00',
    status: 'Confirmed',
    qrCodeUrl: '/qr-code.svg',
  },
  {
    id: 'BK002',
    date: new Date(new Date().setDate(new Date().getDate() - 5)),
    startTime: '17:00',
    endTime: '18:00',
    status: 'Confirmed',
    qrCodeUrl: '/qr-code.svg',
  },
    {
    id: 'BK003',
    date: new Date(new Date().setDate(new Date().getDate() - 10)),
    startTime: '07:00',
    endTime: '09:00',
    status: 'Confirmed',
    qrCodeUrl: '/qr-code.svg',
  },
];

export const mockAddons: Addon[] = [
  { id: 'bat', name: 'Cricket Bat', price: 150, stock: 5, icon: Hammer },
  { id: 'ball', name: 'Leather Ball', price: 50, stock: 20, icon: Baseball },
  { id: 'stumps', name: 'Stumps', price: 75, stock: 15, icon: ToyBrick },
  { id: 'helmet', name: 'Helmet', price: 100, stock: 10, icon: Shield },
  { id: 'pads', name: 'Pads & Gloves', price: 120, stock: 10, icon: Award },
];

export const mockManpower: Manpower[] = [
    { id: 'umpire', name: 'Umpire', price: 300, available: true, icon: Whistle },
    { id: 'coach', name: 'Coach', price: 500, available: false, icon: UserIcon },
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
};
