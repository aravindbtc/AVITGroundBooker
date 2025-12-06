
"use client"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import type { BookingItem, Slot, Venue } from "@/lib/types";
import { Badge } from "../ui/badge";
import { Ticket, Calendar, Clock, CreditCard, Loader2 } from "lucide-react";
import { useDoc, useFirestore, useMemoFirebase, setDocumentNonBlocking, addDocumentNonBlocking, useUser } from "@/firebase";
import { doc, writeBatch, collection } from "firebase/firestore";
import { useState } from "react";
import { format } from "date-fns";

interface BookingSummaryProps {
    slotDetails: Slot[];
    bookingAddons: BookingItem[];
}

export function BookingSummary({ slotDetails, bookingAddons }: BookingSummaryProps) {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const venueRef = useMemoFirebase(() => firestore && doc(firestore, 'venue', 'avit-ground'), [firestore]);
    const { data: venue } = useDoc<Venue>(venueRef);
    const [isBooking, setIsBooking] = useState(false);

    const pricePerHour = venue?.basePrice ?? 500;
    const peakHourSurcharge = 150;

    const slotItems: BookingItem[] = slotDetails.map(slot => ({
        id: slot.id,
        name: `Ground Booking (${slot.startTime} - ${slot.endTime})`,
        quantity: 1,
        price: pricePerHour + (slot.isPeak ? peakHourSurcharge : 0),
        type: 'slot'
    }));

    const allItems = [...slotItems, ...bookingAddons];

    const total = allItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

    const handleConfirmBooking = async () => {
        if (!firestore || !user) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'You must be logged in to book.',
            });
            return;
        }

        setIsBooking(true);
        toast({
            title: "Processing your booking...",
        });

        const batch = writeBatch(firestore);

        // 1. Mark slots as booked
        slotDetails.forEach(slot => {
            const slotRef = doc(firestore, 'slots', slot.id);
            batch.update(slotRef, { status: 'booked', bookedById: user.uid });
        });

        try {
            // 2. Create the main booking document
            const bookingRef = doc(collection(firestore, 'bookings'));
            batch.set(bookingRef, {
                userId: user.uid,
                bookingDate: new Date(),
                total,
                status: 'Confirmed',
                slots: slotDetails.map(s => s.id),
                addons: bookingAddons.map(a => ({ id: a.id, quantity: a.quantity })),
            });
            
            await batch.commit();

            toast({
                title: "Booking Confirmed!",
                description: "Your cricket session is locked in. See you on the field!",
            });
             // TODO: Clear the cart/selections after successful booking
        } catch (error) {
            console.error("Error creating booking:", error);
            toast({
                variant: 'destructive',
                title: 'Booking Failed',
                description: 'Could not complete the booking. Please try again.',
            });
        } finally {
            setIsBooking(false);
        }
    }


    return (
        <div className="sticky bottom-4 z-50">
            <Card className="w-full max-w-4xl mx-auto shadow-2xl rounded-2xl border-2 border-primary/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 font-headline">
                        <Ticket className="h-6 w-6 text-primary" />
                        Booking Summary
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-48">
                        <div className="space-y-4 pr-6">
                            {allItems.map(item => (
                                <div key={item.id} className="flex justify-between items-center text-sm">
                                    <p className="font-medium">{item.name} {item.quantity > 1 && `(x${item.quantity})`}</p>
                                    <div className="flex items-center gap-2">
                                        {item.type === 'slot' && slotDetails.find(s=>s.id === item.id)?.isPeak && (
                                            <Badge variant="outline" className="text-accent border-accent">Peak</Badge>
                                        )}
                                        <p className="font-semibold w-20 text-right">RS.{item.price.toFixed(2)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
                <Separator />
                <CardFooter className="flex flex-col md:flex-row items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 gap-4">
                     <div className="text-center md:text-left">
                        <p className="text-2xl font-bold font-headline">Total: RS.{total.toFixed(2)}</p>
                        {slotDetails.length > 0 && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3"/> {format(slotDetails[0].date.toDate(), 'do MMMM yyyy')}
                                <Clock className="h-3 w-3 ml-2"/> {slotDetails.length} hour(s) booked
                            </p>
                        )}
                    </div>
                     <Button size="lg" className="w-full md:w-auto font-bold text-lg" onClick={handleConfirmBooking} disabled={isBooking}>
                        {isBooking ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Processing...
                            </>
                        ): (
                            <>
                                <CreditCard className="mr-2 h-5 w-5" />
                                Proceed to Book
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
