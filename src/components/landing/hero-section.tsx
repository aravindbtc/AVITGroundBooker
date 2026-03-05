
'use client';
import { Button } from "@/components/ui/button";
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
                    alt={venue.fullName || "AVIT Cricket Ground"}
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
                    Experience the thrill of playing on our ICC-standard cricket ground. Your perfect pitch is just a click away.
                </p>
                
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button size="lg" asChild className="bg-green-500 hover:bg-green-600 w-full sm:w-auto">
                        <Link href="/login">Sign Up Free</Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}
