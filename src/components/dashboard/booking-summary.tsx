'use client';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { BookingItem, Slot } from '@/lib/types';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Ticket, Loader2, CreditCard } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { UserProfile, Venue } from '@/lib/types';
import { doc } from 'firebase/firestore';


interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  order_id: string;
  handler: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string; }) => void;
  prefill: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes: {
    booking_id: string;
    user_uid: string;
  };
  theme: {
    color: string;
  };
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void;
      on: (event: string, callback: () => void) => void;
    };
  }
}


interface Props {
  slots: any[]; // Using any to handle ISO string dates from query param
  addons: BookingItem[];
  onBookingSuccess: () => void;
}

export function BookingSummary({ slots, addons, onBookingSuccess }: Props) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const userProfileRef = useMemoFirebase(() => user && firestore && doc(firestore, 'users', user.uid), [user, firestore]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);
  
  const venueRef = useMemoFirebase(() => firestore && doc(firestore, 'venue', 'avit-ground'), [firestore]);
  const { data: venue } = useDoc<Venue>(venueRef);
  
  const totalSlotPrice = slots.reduce((sum, slot) => sum + slot.price, 0);

  const totalAddonPrice = addons.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const totalAmount = totalSlotPrice + totalAddonPrice;

  const handlePayment = async () => {
      if (!user || !venue) {
          toast({ variant: 'destructive', title: "Not logged in", description: "You must be logged in to book a slot." });
          router.push('/login');
          return;
      }
      setIsProcessing(true);
      toast({title: "Initializing Payment..."});

      try {
        const bookingPayload = {
          slots: slots.map(slot => ({
            ...slot,
            startAt: new Date(slot.startAt).toISOString(),
            endAt: new Date(slot.endAt).toISOString(),
          })),
          addons,
          totalAmount,
          user: { uid: user.uid }
        };

        // 1. Create a pending booking and a Razorpay Order via our new API Route
        const orderResponse = await fetch('/api/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingPayload)
        });

        const orderResult = await orderResponse.json();
        
        if (!orderResult.success) {
            throw new Error(orderResult.error || "Could not create Razorpay order.");
        }
        
        const { orderId, bookingId, amount } = orderResult;

        // 2. Open Razorpay Checkout
        const options: RazorpayOptions = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
            amount: amount,
            currency: "INR",
            name: venue.fullName,
            description: "Cricket Ground Booking",
            order_id: orderId,
            handler: async (response) => {
                // 3. Verify payment on the backend for quick UI feedback
                toast({ title: "Verifying Payment..."});
                 try {
                     const verificationResponse = await fetch('/api/verify-payment', {
                         method: 'POST',
                         headers: { 'Content-Type': 'application/json' },
                         body: JSON.stringify({
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                            bookingId: bookingId,
                            user: { uid: user.uid }
                         })
                     });
                    const verificationResult = await verificationResponse.json();

                    if (verificationResult.success) {
                        toast({ title: "Booking Successful!", description: "Your booking is confirmed." });
                        onBookingSuccess();
                        router.push(`/bookings?id=${bookingId}`);
                    } else {
                        throw new Error(verificationResult.error || "Payment verification failed.");
                    }
                } catch(e: any) {
                    console.error("Verification failed on client:", e);
                    toast({ variant: 'destructive', title: 'Verification Failed', description: e.message || 'Please check your bookings page or contact support.' });
                    router.push('/bookings');
                }
            },
            prefill: {
                name: userProfile?.fullName,
                email: user.email!,
                contact: userProfile?.phone,
            },
            notes: {
                booking_id: bookingId,
                user_uid: user.uid,
            },
            theme: {
                color: "#10B981"
            }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function () {
            toast({ variant: 'destructive', title: 'Payment Failed', description: 'Your payment could not be processed. Please try again.' });
            // Cleanup of pending booking can be handled by a scheduled function or webhook
        });
        rzp.open();

      } catch (error: any) {
          console.error("Booking Error:", error);
          toast({ variant: 'destructive', title: 'Booking Failed', description: error.message || 'An unexpected error occurred.' });
      } finally {
          setIsProcessing(false);
      }
  }


  return (
    <Card className="w-full mx-auto shadow-2xl rounded-2xl border-2 border-primary/20">
        <CardHeader>
            <CardTitle className="flex items-center gap-3 font-headline">
                <Ticket className="h-6 w-6 text-primary" />
                Booking Summary
            </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2 border-b pb-1">Ground Slots</h4>
                {slots.length > 0 ? slots.map((slot, i) => (
                <div key={`slot-${i}`} className="flex justify-between py-1 text-sm">
                    <div className="flex flex-col">
                        <span className="font-medium">{new Date(slot.startAt).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                        <span className="text-xs text-muted-foreground">
                            {new Date(slot.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(slot.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                     <span className="font-semibold">Rs.{slot.price.toFixed(2)}</span>
                </div>
                )) : <p className="text-sm text-muted-foreground">No slots selected.</p>}
              </div>
              
              <div>
                <h4 className="font-semibold mb-2 border-b pb-1">Add-Ons</h4>
                 {addons.length > 0 ? addons.map((item) => (
                    <div key={item.id} className="flex justify-between py-1 text-sm">
                        <span className="font-medium">{item.name} (x{item.quantity})</span>
                        <span className="font-semibold">Rs.{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                )) : <p className="text-sm text-muted-foreground">No add-ons selected.</p>}
              </div>

            </div>
        </CardContent>
        <CardFooter className="flex-col items-start gap-4 p-4 bg-slate-50 dark:bg-slate-900/50">
             <div className="flex justify-between w-full font-bold text-lg">
                <span>Total:</span>
                <span>Rs.{totalAmount.toFixed(2)}</span>
             </div>
            <Button onClick={handlePayment} className="w-full mt-2 font-bold" disabled={isProcessing || slots.length === 0}>
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CreditCard className="mr-2 h-4 w-4" />}
                Proceed to Pay
            </Button>
        </CardFooter>
    </Card>
  );
}
