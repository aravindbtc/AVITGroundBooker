export type User = {
  name: string;
  email: string;
  avatarUrl: string;
  collegeId: string;
  loyalty: {
    points: number;
    tier: 'Bronze' | 'Silver' | 'Gold';
  };
};

export type Booking = {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: 'Confirmed' | 'Pending' | 'Cancelled';
  qrCodeUrl: string;
};

export type Addon = {
  id: string;
  name: string;
  price: number;
  stock: number;
  icon: React.ComponentType<{ className?: string }>;
};

export type Manpower = {
  id: string;
  name: string;
  price: number;
  stock: number;
  icon: React.ComponentType<{ className?: string }>;
};
