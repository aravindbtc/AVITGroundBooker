
'use client';
import { Clock, ShieldCheck, Gem } from 'lucide-react';
import { Button } from '../ui/button';
import Link from 'next/link';

const features = [
  {
    icon: <Clock className="h-10 w-10 text-primary" />,
    title: 'Instant Booking',
    description: 'Search, select, and pay in under 2 minutes with our real-time availability checker. No more waiting for confirmations!',
    cta: 'Start Booking'
  },
  {
    icon: <ShieldCheck className="h-10 w-10 text-primary" />,
    title: 'Secure & Affordable',
    description: 'We use Razorpay for secure payments. Plus, get exclusive deals and up to 20% off for new users.',
    cta: 'Sign Up Now'
  },
  {
    icon: <Gem className="h-10 w-10 text-primary" />,
    title: 'Community Vibes',
    description: 'Rate grounds, review matches, and connect with local teams. Find your next game or rival!',
    cta: 'Join the Community'
  }
];

export function WhyBookWithUs() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-headline font-bold">Why Book With Us?</h2>
            <p className="text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">
                We're not just a booking platform; we're building a community for cricket lovers.
            </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center p-8 border rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 flex flex-col">
              <div className="mx-auto bg-green-100 p-4 rounded-full mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-headline font-bold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground flex-grow mb-6">{feature.description}</p>
              <Button asChild variant="link" className="text-primary font-bold">
                  <Link href="/register">{feature.cta} &rarr;</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
