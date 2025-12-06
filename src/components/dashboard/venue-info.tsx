"use client";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Map } from "./map";
import { avit_details } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Navigation, Phone, Clock } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

export function VenueInfo() {
  const venueImages = PlaceHolderImages.filter(img => img.id.startsWith("avit-ground"));
  
  return (
    <Card className="shadow-lg rounded-xl overflow-hidden">
      <CardHeader className="p-0">
         <Carousel className="w-full">
          <CarouselContent>
            {venueImages.map((image, index) => (
              <CarouselItem key={index}>
                <div className="relative aspect-video w-full">
                  <Image
                    src={image.imageUrl}
                    alt={image.description}
                    fill
                    className="object-cover"
                    data-ai-hint={image.imageHint}
                  />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-4" />
          <CarouselNext className="right-4" />
        </Carousel>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <CardTitle className="font-headline text-2xl">{avit_details.fullName}</CardTitle>
       
        <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3 text-muted-foreground">
                <MapPin className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                <span className="font-medium">{avit_details.address}</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-accent">
                    {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-5 w-5 ${i < Math.floor(avit_details.rating) ? 'fill-current' : 'stroke-current text-muted-foreground/50'}`} />
                    ))}
                </div>
                <span className="font-bold text-base">{avit_details.rating}/5.0</span>
                <span className="text-muted-foreground text-xs">(342 Reviews)</span>
            </div>
             <div className="flex items-center gap-3 text-muted-foreground">
                <Clock className="h-5 w-5 flex-shrink-0 text-primary" />
                <span className="font-medium">5:00 AM - 10:00 PM</span>
            </div>
        </div>

        <div className="h-48 w-full rounded-lg overflow-hidden border">
          <Map />
        </div>
      </CardContent>
      <CardFooter className="grid grid-cols-2 gap-3 p-6 pt-0">
        <Button asChild size="lg" className="font-bold">
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${avit_details.gps.lat},${avit_details.gps.lng}`} target="_blank" rel="noopener noreferrer">
                <Navigation />
                Directions
            </a>
        </Button>
         <Button asChild variant="outline" size="lg" className="font-bold">
            <a href={`tel:${avit_details.contact.general}`}>
                <Phone />
                Call Venue
            </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
