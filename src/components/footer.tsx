"use client"
import Link from 'next/link';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Venue } from '@/lib/types';
import { Skeleton } from './ui/skeleton';

const AppLogoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
        <path d="M15.5 8.5 8.5 15.5" />
        <path d="M15.5 15.5 8.5 8.5" />
        <path d="m18 6-1.5 1.5" />
        <path d="m6 18 1.5-1.5" />
    </svg>
)

export function Footer() {
  const firestore = useFirestore();
  const venueRef = useMemoFirebase(() => firestore && doc(firestore, 'venue', 'avit-ground'), [firestore]);
  const { data: venue, isLoading } = useDoc<Venue>(venueRef);

  return (
    <footer className="border-t bg-card text-card-foreground mt-12">
      <div className="container mx-auto px-4 py-8 md:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <AppLogoIcon />
                </div>
                <span className="font-headline text-xl font-bold">AVIT Cricket Booker</span>
            </div>
            {isLoading ? <Skeleton className="h-10 w-full" /> : <p className="text-sm text-muted-foreground">{venue?.address}</p>}
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm md:col-span-2 md:grid-cols-3">
            <div>
              <h3 className="mb-2 font-semibold">Contact</h3>
              {isLoading ? (
                <ul className="space-y-2">
                    <li><Skeleton className="h-4 w-32" /></li>
                    <li><Skeleton className="h-4 w-32" /></li>
                    <li><Skeleton className="h-4 w-40" /></li>
                </ul>
              ) : venue ? (
                <ul className="space-y-2 text-muted-foreground">
                    <li>Primary: {venue.contact.primary}</li>
                    <li>Admissions: {venue.contact.secondary}</li>
                    <li>Email: <a href={`mailto:${venue.contact.email}`} className="hover:text-primary">{venue.contact.email}</a></li>
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Contact info not available.</p>
              )}
            </div>
            <div>
              <h3 className="mb-2 font-semibold">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link href="/" className="text-muted-foreground hover:text-primary">Home</Link></li>
                <li><Link href="/bookings" className="text-muted-foreground hover:text-primary">Bookings</Link></li>
                <li><Link href="/profile" className="text-muted-foreground hover:text-primary">Profile</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-2 font-semibold">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-muted-foreground hover:text-primary">Terms of Service</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t pt-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Aarupadai Veedu Institute of Technology. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
