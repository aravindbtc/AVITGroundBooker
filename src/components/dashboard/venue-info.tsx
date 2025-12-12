
"use client";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Map } from "./map";
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
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { Venue } from "@/lib/types";
import { Skeleton } from "../ui/skeleton";

export function VenueInfo() {
  const firestore = useFirestore();
  const venueRef = useMemoFirebase(() => firestore && doc(firestore, 'venue', 'avit-ground'), [firestore]);
  const { data: venue, isLoading } = useDoc<Venue>(venueRef);
  const fallbackImages = PlaceHolderImages.filter(img => img.id.startsWith("avit-ground"));
  
  const venueImages = (venue?.images && venue.images.length > 0) 
    ? venue.images.map((url, index) => ({ id: `venue-img-${index}`, imageUrl: url, description: venue.fullName, imageHint: 'cricket ground' }))
    : fallbackImages;


  if (isLoading) {
    return (
      <Card className="shadow-lg rounded-xl overflow-hidden">
        <Skeleton className="aspect-video w-full" />
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-5 w-full" />
            </div>
             <div className="flex items-center gap-2">
               <Skeleton className="h-5 w-24" />
            </div>
             <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-5 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-48 w-full rounded-lg" />
        </CardContent>
        <CardFooter className="grid grid-cols-2 gap-3 p-6 pt-0">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardFooter>
      </Card>
    );
  }

  if (!venue) {
    return (
        <Card className="shadow-lg rounded-xl overflow-hidden">
            <CardHeader>
                <CardTitle>Venue Information Not Available</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">The venue details could not be loaded. Please check back later.</p>
            </CardContent>
        </Card>
    )
  }

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
        <CardTitle className="font-headline text-2xl">{venue.fullName}</CardTitle>
       
        <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3 text-muted-foreground">
                <MapPin className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                <span className="font-medium">{venue.address}</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-accent">
                    {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-5 w-5 ${i < Math.floor(venue.rating || 0) ? 'fill-current' : 'stroke-current text-muted-foreground/50'}`} />
                    ))}
                </div>
                <span className="font-bold text-base">{venue.rating?.toFixed(1) || 'N/A'}/5.0</span>
                <span className="text-muted-foreground text-xs">(342 Reviews)</span>
            </div>
             <div className="flex items-center gap-3 text-muted-foreground">
                <Clock className="h-5 w-5 flex-shrink-0 text-primary" />
                <span className="font-medium">5:00 AM - 10:00 PM</span>
            </div>
        </div>

        <div className="h-48 w-full rounded-lg overflow-hidden border">
          <Map position={venue.gps} />
        </div>
      </CardContent>
      <CardFooter className="grid grid-cols-2 gap-3 p-6 pt-0">
        <Button asChild size="lg" className="font-bold">
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${venue.gps.lat},${venue.gps.lng}`} target="_blank" rel="noopener noreferrer">
                <Navigation />
                Directions
            </a>
        </Button>
         <Button asChild variant="outline" size="lg" className="font-bold">
            <a href={`tel:${venue.contact.general}`}>
                <Phone />
                Call Venue
            </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
