import { avit_details } from '@/lib/data';
import Link from 'next/link';

const CricketBallIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a10 10 0 0 0-7.5 16.8" />
      <path d="M12 22a10 10 0 0 1-7.5-16.8" />
      <path d="M2.2 12h19.6" />
    </svg>
)

export function Footer() {
  return (
    <footer className="border-t bg-card text-card-foreground">
      <div className="container mx-auto px-4 py-8 md:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="mb-4 flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <CricketBallIcon />
                </div>
                <span className="font-headline text-xl font-bold">AVIT Cricket Booker</span>
            </div>
            <p className="text-sm text-muted-foreground">{avit_details.address}</p>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm md:col-span-2 md:grid-cols-3">
            <div>
              <h3 className="mb-2 font-semibold">Contact</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>General: {avit_details.contact.general}</li>
                <li>Support: {avit_details.contact.admissions}</li>
                <li>Email: <a href={`mailto:${avit_details.contact.email}`} className="hover:text-primary">{avit_details.contact.email}</a></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-2 font-semibold">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link href="/" className="text-muted-foreground hover:text-primary">Home</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary">Bookings</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary">Profile</Link></li>
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
