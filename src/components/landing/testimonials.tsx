
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

const testimonials = [
  {
    quote: "Finally, no more calling grounds at midnight! Booked my weekend game in a single click. This app is a game-changer for local cricket.",
    name: "Rohit S.",
    location: "Mumbai",
    avatarId: "avatar-1",
    stars: 5,
  },
  {
    quote: "The interface is so clean and fast. I found a turf near my office and booked it for a corporate match instantly. The payment was seamless.",
    name: "Priya K.",
    location: "Delhi",
    avatarId: "avatar-2",
    stars: 5,
  },
  {
    quote: "As a team captain, managing bookings was a headache. Now I can see all available slots and book for the entire team. Highly recommended!",
    name: "Arjun V.",
    location: "Bangalore",
    avatarId: "avatar-3",
    stars: 5,
  }
];

export function Testimonials() {
    const avatarImages = PlaceHolderImages.filter(p => p.id.startsWith('avatar'));

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
