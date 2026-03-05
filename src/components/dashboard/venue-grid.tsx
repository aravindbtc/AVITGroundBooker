
"use client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Image from "next/image";
import { MapPin, Star } from "lucide-react";
import { Badge } from "../ui/badge";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { Venue } from "@/lib/types";
import { Skeleton } from "../ui/skeleton";

export function VenueGrid() {
  const firestore = useFirestore();
  const venueRef = useMemoFirebase(() => firestore && doc(firestore, 'venue', 'avit-ground'), [firestore]);
  const { data: venue, isLoading } = useDoc<Venue>(venueRef);
  const fallbackImage = PlaceHolderImages.find(img => img.id === "avit-ground-1");

  const primaryImage = (venue?.images && venue.images.length > 0)
        ? { imageUrl: venue.images[0], description: venue.fullName, imageHint: 'cricket ground' }
        : fallbackImage;


  if (isLoading || !venue) {
    return (
        <div>
            <h2 className="text-2xl font-bold font-headline mb-4">The Ground</h2>
            <Card className="overflow-hidden shadow-lg">
                <CardHeader className="p-0">
                    <Skeleton className="aspect-video w-full" />
                </CardHeader>
                <CardContent className="p-4 flex justify-between items-center bg-card">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-5 w-16" />
                    </div>
                    <div className="text-right">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-4 w-16 mt-1" />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div>
        <h2 className="text-2xl font-bold font-headline mb-4">The Ground</h2>
        <div className="grid grid-cols-1 gap-6">
            <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 group">
                <CardHeader className="p-0">
                    <div className="relative aspect-video w-full">
                        {primaryImage && (
                            <Image
                                src={primaryImage.imageUrl}
                                alt={primaryImage.description}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                                data-ai-hint={primaryImage.imageHint}
                            />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                        <div className="absolute bottom-4 left-4">
                            <h3 className="text-2xl font-bold text-white font-headline">{venue.fullName}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-200">
                                <MapPin className="h-4 w-4" />
                                <span>Paiyanoor, Chennai</span>
                            </div>
                        </div>
                        <Badge className="absolute top-4 right-4 bg-accent text-accent-foreground font-bold">PROMOTED</Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-4 flex justify-between items-center bg-card">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-accent">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`h-5 w-5 ${i < Math.floor(venue.rating || 0) ? 'fill-current' : 'stroke-current text-muted-foreground/50'}`} />
                            ))}
                        </div>
                        <span className="font-bold text-base">{venue.rating?.toFixed(1) || 'N/A'}/5.0</span>
                        <span className="text-muted-foreground text-xs">(342 Reviews)</span>
                    </div>
                    <div className="text-right">
                        <p className="font-semibold text-lg text-primary">Rs.{venue.basePrice}/hour</p>
                        <p className="text-xs text-muted-foreground">starts from</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
