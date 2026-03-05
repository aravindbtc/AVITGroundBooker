
'use client';
import Image from "next/image";
import { Star } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { PlaceHolderImages } from "@/lib/placeholder-images";
import type { Rating } from "@/lib/types";
import { useEffect, useState } from "react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where, limit } from "firebase/firestore";

// The hardcoded array is removed. This component will fetch real ratings in the future.
// For now, it will show nothing until there is data.
const testimonials: any[] = [];


export function Testimonials() {
    const avatarImages = PlaceHolderImages.filter(p => p.id.startsWith('avatar'));

    if (testimonials.length === 0) {
        return null; // Don't render anything if there are no testimonials yet.
    }

    return (
        <section className="py-16 md:py-24 bg-gray-50">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-headline font-bold">Loved by Players Everywhere</h2>
                    <p className="text-lg text-muted-foreground mt-2">Your turn? Sign up and score big!</p>
                </div>
                
                <Carousel
                  opts={{
                    align: "start",
                    loop: true,
                  }}
                  className="w-full max-w-4xl mx-auto"
                >
                    <CarouselContent>
                        {testimonials.map((testimonial, index) => {
                            const avatar = avatarImages.find(p => p.id === testimonial.avatarId);
                            return (
                                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                                    <div className="p-1">
                                        <div className="bg-white p-8 rounded-xl shadow-lg h-full flex flex-col">
                                            <div className="flex mb-4">
                                                {[...Array(testimonial.stars)].map((_, i) => (
                                                    <Star key={i} className="h-5 w-5 text-amber-400 fill-amber-400" />
                                                ))}
                                            </div>
                                            <p className="text-muted-foreground flex-grow">"{testimonial.quote}"</p>
                                            <div className="mt-6 flex items-center">
                                                {avatar && (
                                                    <Image
                                                        src={avatar.imageUrl}
                                                        alt={testimonial.name}
                                                        width={48}
                                                        height={48}
                                                        className="rounded-full mr-4"
                                                        data-ai-hint={avatar.imageHint}
                                                    />
                                                )}
                                                <div>
                                                    <p className="font-bold">{testimonial.name}</p>
                                                    <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CarouselItem>
                            )
                        })}
                    </CarouselContent>
                    <CarouselPrevious className="hidden sm:flex" />
                    <CarouselNext className="hidden sm:flex" />
                </Carousel>
            </div>
        </section>
    );
}
