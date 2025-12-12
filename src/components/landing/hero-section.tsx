
'use client';
import { Button } from "@/components/ui/button";
import { Calendar, Users, MapPin, Search } from "lucide-react";
import Link from 'next/link';
import type { Venue } from '@/lib/types';
import Image from "next/image";

export function HeroSection({ venue }: { venue: Venue }) {
    const primaryImage = (venue.images && venue.images.length > 0) ? venue.images[0] : "https://picsum.photos/seed/cricket-poster/1920/1080";

    return (
        <section className="relative h-screen flex items-center justify-center text-white">
            <div className="absolute inset-0">
                <Image
                    src={primaryImage}
                    alt={venue.fullName}
                    fill
                    className="object-cover"
                    data-ai-hint="cricket ground"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent"></div>
            </div>
            <div className="relative z-10 text-center px-4">
                <h1 className="text-4xl md:text-6xl font-headline font-bold mb-4 drop-shadow-2xl">
                    {venue.fullName || "Book Your Perfect Pitch in Seconds"}
                </h1>
                <p className="text-lg md:text-xl mb-8 max-w-3xl mx-auto">
                    Discover 100+ premium grounds across India. No more queues—just swipe, book, and bat!
                </p>

                <div className="p-4 bg-white/10 backdrop-blur-md rounded-xl max-w-4xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                        <div className="relative col-span-1 md:col-span-2">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <Input placeholder="Search by city or area..." className="pl-10 text-black" />
                        </div>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                             <Input type="date" placeholder="Select Date" className="pl-10 text-black" />
                        </div>
                         <div className="relative">
                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <Input type="number" placeholder="Players (e.g. 11)" className="pl-10 text-black" />
                        </div>
                        <Button size="lg" className="w-full h-12 text-lg bg-green-500 hover:bg-green-600 col-span-1">
                            <Search className="mr-2 h-5 w-5" />
                            Search
                        </Button>
                    </div>
                </div>
                
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button size="lg" asChild className="bg-green-500 hover:bg-green-600 w-full sm:w-auto">
                        <Link href="/login">Sign Up Free & Get Rs.100 Off</Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}

// A simple input for demonstration. You would likely use a more complex component from shadcn/ui.
const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} className={`w-full h-12 px-4 py-2 rounded-md bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 ${props.className || ''}`} />
);
