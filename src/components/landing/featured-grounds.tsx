
'use client';

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Users } from "lucide-react";
import Link from "next/link";
import { Badge } from "../ui/badge";
import type { Venue } from "@/lib/types";

export function FeaturedGrounds({ venue }: { venue: Venue }) {
  const primaryImage = (venue.images && venue.images.length > 0) ? venue.images[0] : "https://images.unsplash.com/photo-1639416726422-67dbda6962c2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw4fHxjcmlja2V0JTIwdHVyZiUyMG5pZ2h0fGVufDB8fHx8MTc2NTM3MzgzNHww&ixlib=rb-4.1.0&q=80&w=1080";

  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-headline font-bold">Our Featured Ground</h2>
            <p className="text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">
                Our ICC-standard ground is handpicked for a top-tier playing experience. Join 10,000+ players who've booked with us!
            </p>
        </div>

        <div className="grid grid-cols-1 justify-center">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden group transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 max-w-3xl mx-auto">
            <div className="relative">
              <Image
                src={primaryImage}
                alt={venue.fullName}
                width={800}
                height={450}
                className="w-full h-72 object-cover"
                data-ai-hint="cricket ground"
              />
              <Badge className="absolute top-4 right-4 bg-green-500 text-white border-green-500">
                  Available Now
              </Badge>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold font-headline mb-2">{venue.fullName}</h3>
              <div className="flex items-center text-muted-foreground text-sm mb-4">
                <MapPin className="h-4 w-4 mr-2 text-primary" />
                {venue.address}
              </div>
              <div className="flex justify-between items-center mb-4 text-sm">
                  <div className="flex items-center gap-1">
                      <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                      <span className="font-bold">{venue.rating.toFixed(1)}</span>
                      <span className="text-muted-foreground">(342 reviews)</span>
                  </div>
                  <div className="flex items-center gap-1">
                      <Users className="h-5 w-5 text-primary" />
                      <span className="font-bold">22 Players</span>
                  </div>
              </div>
              <div className="flex justify-between items-center border-t pt-4">
                  <p className="text-lg font-bold text-primary">₹{venue.basePrice}<span className="text-sm font-normal text-muted-foreground">/hr</span></p>
                  <Button asChild className="bg-blue-600 hover:bg-blue-700">
                      <Link href="/login">View Details & Book</Link>
                  </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
