
'use client';

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Users } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Link from "next/link";
import { Badge } from "../ui/badge";

export function FeaturedGrounds() {
  const featured = PlaceHolderImages.filter(p => p.id.includes('ground-featured'));

  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-headline font-bold">Featured Grounds</h2>
            <p className="text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">
                Handpicked grounds with top ratings and availability. Join 10,000+ players who've booked with us!
            </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {featured.map((ground, index) => (
            <div key={ground.id} className="bg-white rounded-xl shadow-lg overflow-hidden group transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
              <div className="relative">
                <Image
                  src={ground.imageUrl}
                  alt={ground.description}
                  width={600}
                  height={400}
                  className="w-full h-56 object-cover"
                  data-ai-hint={ground.imageHint}
                />
                 <Badge className="absolute top-4 right-4 bg-green-500 text-white border-green-500">
                    Available Now
                </Badge>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold font-headline mb-2">{ground.description}</h3>
                <div className="flex items-center text-muted-foreground text-sm mb-4">
                  <MapPin className="h-4 w-4 mr-2 text-primary" />
                  Paiyanoor, Chennai
                </div>
                <div className="flex justify-between items-center mb-4 text-sm">
                    <div className="flex items-center gap-1">
                        <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                        <span className="font-bold">4.9</span>
                        <span className="text-muted-foreground">(150+ reviews)</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Users className="h-5 w-5 text-primary" />
                        <span className="font-bold">22 Players</span>
                    </div>
                </div>
                 <div className="flex justify-between items-center border-t pt-4">
                     <p className="text-lg font-bold text-primary">₹800<span className="text-sm font-normal text-muted-foreground">/hr</span></p>
                    <Button asChild className="bg-blue-600 hover:bg-blue-700">
                        <Link href="/register">View Details</Link>
                    </Button>
                 </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
