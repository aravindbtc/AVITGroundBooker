
"use client"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import type { BookingItem, Slot, Venue, UserProfile } from "@/lib/types";
import { Badge } from "../ui/badge";
import { Ticket, Calendar, Clock, CreditCard, Loader2 } from "lucide-react";
import { useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { doc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useState } from "react";
import { format } from "date-fns";

interface BookingSummaryProps {
    selectedDate: Date;
    slotDetails: Slot[];
    bookingAddons: BookingItem[];
    onBookingSuccess: () => void;
}

declare global {
    interface Window {
        Razorpay: any;
    }
}

export function BookingSummary({ selectedDate, slotDetails, bookingAddons, onBookingSuccess }: BookingSummaryProps) {
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();
    const { toast } = useToast();
    const venueRef = useMemoFirebase(() => firestore && doc(firestore, 'venue', 'avit-ground'), [firestore]);
    const { data: venue } = useDoc<Venue>(venueRef);
    const userProfileRef = useMemoFirebase(() => (firestore && user) && doc(firestore, 'users', user.uid), [firestore, user]);
    const { data: userProfile } = useDoc<UserProfile>(userProfileRef);
    const [isBooking, setIsBooking] = useState(false);

    const slotItems: BookingItem[] = slotDetails.map(slot => ({
        id: slot.id,
        name: `Ground Booking (${slot.startTime} - ${slot.endTime})`,
        quantity: 1,
        price: slot.price,
        type: 'slot'
    }));

    const allItems = [...slotItems, ...bookingAddons];

    const total = allItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

    const handleConfirmBooking = async () => {
        if (!user || !userProfile) {
            toast({
                variant: 'destructive',
                title: 'Please log in',
                description: 'You must be logged in to make a booking.',
            });
            return;
        }

        if (slotDetails.length === 0) {
             toast({
                variant: 'destructive',
                title: 'No Slots Selected',
                description: 'Please select at least one time slot to book.',
            });
            return;
        }

        setIsBooking(true);
        toast({ title: "Initiating payment..." });

        try {
            const functions = getFunctions();
            const createRazorpayOrder = httpsCallable(functions, 'createRazorpayOrder');

            const orderRequestData = {
                slots: slotDetails.map(s => s.id),
                addons: bookingAddons.map(a => ({ id: a.id, name: a.name, quantity: a.quantity, price: a.price, type: a.type })),
                totalAmount: total,
            };
            
            const result: any = await createRazorpayOrder(orderRequestData);
            const { orderId, bookingId, key } = result.data;

            const options = {
                key: key,
                amount: total * 100,
                currency: "INR",
                name: "AVIT Cricket Booker",
                description: `Booking ID: ${bookingId.substring(0,8)}`,
                order_id: orderId,
                handler: function (response: any) {
                    toast({
                        title: "Payment Successful!",
                        description: "Your booking is confirmed.",
                    });
                    // Webhook will handle the rest, but we can optimistically update UI
                    onBookingSuccess();
                    setIsBooking(false);
                },
                prefill: {
                    name: userProfile.fullName,
                    email: userProfile.email,
                    contact: userProfile.phone || '',
                },
                notes: {
                    bookingId: bookingId,
                    userId: user.uid,
                },
                theme: {
                    color: "#16a34a" // Green color
                },
                 modal: {
                    ondismiss: function() {
                        toast({
                            variant: 'destructive',
                            title: 'Payment Cancelled',
                            description: 'Your slots have been released. Please try again.',
                        });
                        setIsBooking(false);
                        // A function could be triggered here to release blocked slots
                    }
                }
            };
            
            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response: any) {
                toast({
                    variant: 'destructive',
                    title: 'Payment Failed',
                    description: response.error.description || 'Something went wrong.',
                });
                setIsBooking(false);
            });

            rzp.open();

        } catch (error: any) {
            console.error("Error creating booking:", error);
            toast({
                variant: 'destructive',
                title: 'Booking Failed',
                description: error.message || 'Could not initiate the payment process. Please try again.',
            });
            setIsBooking(false);
        }
    }

    const dateDisplay = selectedDate ? format(selectedDate, 'do MMMM yyyy') : 'No date selected';


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
                            {allItems.length > 0 ? allItems.map(item => (
                                <div key={item.id} className="flex justify-between items-center text-sm">
                                    <p className="font-medium">{item.name} {item.quantity > 1 && `(x${item.quantity})`}</p>
                                    <div className="flex items-center gap-2">
                                        {item.type === 'slot' && slotDetails.find(s=>s.id === item.id)?.isPeak && (
                                            <Badge variant="outline" className="text-accent border-accent">Peak</Badge>
                                        )}
                                        <p className="font-semibold w-20 text-right">RS.{item.price.toFixed(2)}</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center text-muted-foreground p-4">Select slots and add-ons to see them here.</div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
                <Separator />
                <CardFooter className="flex flex-col md:flex-row items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 gap-4">
                     <div className="text-center md:text-left">
                        <p className="text-2xl font-bold font-headline">Total: RS.{total.toFixed(2)}</p>
                        {slotDetails.length > 0 && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3"/> {dateDisplay}
                                <Clock className="h-3 w-3 ml-2"/> {slotDetails.length} hour(s) booked
                            </p>
                        )}
                    </div>
                     <Button size="lg" className="w-full md:w-auto font-bold text-lg" onClick={handleConfirmBooking} disabled={isBooking || isUserLoading || allItems.length === 0}>
                        {isBooking ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Processing...
                            </>
                        ): (
                            <>
                                <CreditCard className="mr-2 h-5 w-5" />
                                Proceed to Pay
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
