"use client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { avit_details } from "@/lib/data";
import Image from "next/image";
import { MapPin, Star } from "lucide-react";
import { Badge } from "../ui/badge";

export function VenueGrid() {
  const venueImage = PlaceHolderImages.find(img => img.id === "avit-ground-1");

  return (
    <div>
        <h2 className="text-2xl font-bold font-headline mb-4">The Ground</h2>
        <div className="grid grid-cols-1 gap-6">
            <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 group">
                <CardHeader className="p-0">
                    <div className="relative aspect-video w-full">
                        {venueImage && (
                            <Image
                                src={venueImage.imageUrl}
                                alt={venueImage.description}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                                data-ai-hint={venueImage.imageHint}
                            />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                        <div className="absolute bottom-4 left-4">
                            <h3 className="text-2xl font-bold text-white font-headline">{avit_details.fullName}</h3>
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
                                <Star key={i} className={`h-5 w-5 ${i < Math.floor(avit_details.rating) ? 'fill-current' : 'stroke-current text-muted-foreground/50'}`} />
                            ))}
                        </div>
                        <span className="font-bold text-base">{avit_details.rating}/5.0</span>
                        <span className="text-muted-foreground text-xs">(342 Reviews)</span>
                    </div>
                    <div className="text-right">
                        <p className="font-semibold text-lg text-primary">₹500/hour</p>
                        <p className="text-xs text-muted-foreground">starts from</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
