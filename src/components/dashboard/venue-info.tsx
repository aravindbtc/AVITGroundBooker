import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Map } from "./map";
import { avit_details } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Navigation, Phone } from "lucide-react";
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
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">{avit_details.fullName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Carousel className="w-full">
          <CarouselContent>
            {venueImages.map((image, index) => (
              <CarouselItem key={index}>
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg">
                  <Image
                    src={image.imageUrl}
                    alt={image.description}
                    fill
                    className="object-cover"
                    data-ai-hint={image.imageHint}
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-2" />
          <CarouselNext className="right-2" />
        </Carousel>

        <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="mt-1 h-4 w-4 flex-shrink-0 text-primary" />
                <span>{avit_details.address}</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-accent">
                    {[...Array(Math.floor(avit_details.rating))].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                    {avit_details.rating % 1 !== 0 && <Star key="half" className="h-4 w-4 fill-current" style={{ clipPath: 'inset(0 50% 0 0)' }} />}
                    {[...Array(5 - Math.ceil(avit_details.rating))].map((_, i) => (
                         <Star key={`empty-${i}`} className="h-4 w-4 stroke-current" />
                    ))}
                </div>
                <span className="font-semibold">{avit_details.rating}/5.0</span>
            </div>
        </div>

        <div className="h-48 w-full">
          <Map />
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
            <Button asChild size="sm">
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${avit_details.gps.lat},${avit_details.gps.lng}`} target="_blank" rel="noopener noreferrer">
                    <Navigation />
                    Navigate
                </a>
            </Button>
             <Button asChild variant="outline" size="sm">
                <a href={`tel:${avit_details.contact.general}`}>
                    <Phone />
                    Call
                </a>
            </Button>
        </div>
        <p className="text-xs text-muted-foreground">Operating Hours: 5 AM - 10 PM</p>
      </CardFooter>
    </Card>
  );
}
