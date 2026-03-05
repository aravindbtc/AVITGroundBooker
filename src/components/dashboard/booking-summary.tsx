
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { BookingItem } from '@/lib/types';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Ticket, Loader2, CreditCard, Check, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { UserProfile, Venue, SerializedSlot, Booking } from '@/lib/types';
import { doc, collection, addDoc, writeBatch, Timestamp } from 'firebase/firestore';


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
  slots: SerializedSlot[]; // Using proper type for serialized slots
  addons: BookingItem[];
  onBookingSuccess: () => void;
}

/**
 * Get user-friendly error message based on error type
 */
function getPaymentErrorMessage(error: unknown, context?: string): string {
  const errorStr = String(error).toLowerCase();
  
  if (errorStr.includes('signature') || errorStr.includes('verification')) {
    return 'Payment verification failed. This is likely a network issue. Please refresh the page and check your bookings - your payment may still have been processed.';
  }
  if (errorStr.includes('network') || errorStr.includes('timeout')) {
    return 'Network connectivity issue. Please check your internet connection and try again. Your payment status will be verified automatically.';
  }
  if (errorStr.includes('amount') || errorStr.includes('price')) {
    return 'Price validation failed. The booking rate may have changed. Please refresh and try again.';
  }
  if (errorStr.includes('slot') || errorStr.includes('booked')) {
    return 'One or more selected slots are no longer available. Please refresh and select new slots.';
  }
  if (errorStr.includes('authentication') || errorStr.includes('token')) {
    return 'Your authentication expired. Please log in again and try booking.';
  }
  
  return context 
    ? `${context}. Please try again or contact support if the issue persists.`
    : 'An unexpected error occurred. Please try again or contact support.';
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

  const handleBookingWithoutPayment = async () => {
      if (!user || !venue || !firestore) {
          toast({ 
            variant: 'destructive', 
            title: "Not logged in", 
            description: "You must be logged in to book a slot." 
          });
          router.push('/login');
          return;
      }
      
      if (slots.length === 0) {
          toast({
            variant: 'destructive',
            title: 'No slots selected',
            description: 'Please select at least one slot before proceeding.'
          });
          return;
      }

      setIsProcessing(true);
      toast({title: "Creating Your Booking...", description: "Please wait..."});

      try {
        // Create booking directly without payment
        const booking: Omit<Booking, 'id'> = {
          uid: user.uid,
          slots: slots.map(slot => slot.id || ''),
          addons,
          totalAmount,
          status: 'paid', // Mark as paid since there's no payment
          createdAt: new Date(),
          groundId: 'avit-ground',
          date: slots[0] ? new Date(slots[0].startAt).toISOString().split('T')[0] : '',
          paymentMethod: 'without-payment', // NEW: Track payment method
          payment: {
            status: 'paid',
            createdAt: Timestamp.now(),
          },
        };

        // Add booking to Firestore
        const bookingsRef = collection(firestore, 'bookings');
        const bookingDoc = await addDoc(bookingsRef, booking);

        // Update slots to mark as booked
        const batch = writeBatch(firestore);
        for (const slot of slots) {
          if (slot.id) {
            const slotRef = doc(firestore, 'slots', slot.id);
            batch.update(slotRef, { 
              status: 'booked',
              bookingId: bookingDoc.id
            });
          }
        }
        await batch.commit();

        toast({
          title: 'Success!',
          description: 'Your booking has been confirmed. You can view it in "My Bookings".',
        });

        // Redirect to bookings page
        router.push('/bookings');
      } catch (error: any) {
          console.error("Booking Error:", error);
          toast({ 
            variant: 'destructive', 
            title: 'Booking Failed', 
            description: 'Could not create booking. Please try again.'
          });
          setIsProcessing(false);
      }
  }

  const handlePayment = async () => {
      if (!user || !venue) {
          toast({ 
            variant: 'destructive', 
            title: "Not logged in", 
            description: "You must be logged in to book a slot." 
          });
          router.push('/login');
          return;
      }
      
      if (slots.length === 0) {
          toast({
            variant: 'destructive',
            title: 'No slots selected',
            description: 'Please select at least one slot before proceeding.'
          });
          return;
      }

      setIsProcessing(true);
      toast({title: "Initializing Payment...", description: "Please wait while we set up your booking."});

      try {
        const idToken = await user.getIdToken();

        const bookingPayload = {
          slots: slots.map(slot => ({
            ...slot,
            startAt: slot.startAt,
            endAt: slot.endAt,
          })),
          addons,
          totalAmount,
        };

        // 1. Create a pending booking and a Razorpay Order via our new API Route
        const orderResponse = await fetch('/api/create-order', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify(bookingPayload),
            signal: AbortSignal.timeout(30000), // 30 second timeout
        });

        const orderResult = await orderResponse.json();
        
        if (!orderResult.success) {
            throw new Error(orderResult.error || "Could not create Razorpay order. Please contact support.");
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
                toast({ title: "Verifying Payment...", description: "This may take a few moments." });
                 try {
                     const verificationToken = await user.getIdToken();
                     const verificationResponse = await fetch('/api/verify-payment', {
                         method: 'POST',
                         headers: { 
                            'Content-Type': 'application/json',
                             'Authorization': `Bearer ${verificationToken}`,
                         },
                         body: JSON.stringify({
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                            bookingId: bookingId,
                         }),
                         signal: AbortSignal.timeout(15000), // 15 second timeout
                     });
                    const verificationResult = await verificationResponse.json();

                    if (verificationResult.success) {
                        toast({ 
                          title: "✓ Booking Successful!", 
                          description: "Your booking is confirmed. You will receive a confirmation email shortly." 
                        });
                        onBookingSuccess();
                        router.push(`/bookings?id=${bookingId}`);
                    } else {
                        throw new Error(verificationResult.error);
                    }
                } catch(e: any) {
                    console.error("Verification failed on client:", e);
                    const errMsg = getPaymentErrorMessage(e, 'Payment verification');
                    toast({ 
                      variant: 'destructive', 
                      title: 'Verification Status Unclear', 
                      description: errMsg
                    });
                    // Still redirect to bookings page - status will resolve via webhook
                    setTimeout(() => router.push('/bookings'), 3000);
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
            toast({ 
              variant: 'destructive', 
              title: 'Payment Failed', 
              description: 'Your payment could not be processed. Please try again with a different payment method.' 
            });
            setIsProcessing(false);
            // Cleanup of pending booking is handled by the webhook or a scheduled function
        });
        rzp.open();

      } catch (error: any) {
          console.error("Booking Error:", error);
          const errMsg = getPaymentErrorMessage(error, 'Booking initialization failed');
          toast({ 
            variant: 'destructive', 
            title: 'Booking Failed', 
            description: errMsg
          });
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
                     <span className="font-semibold">₹{slot.price.toFixed(2)}</span>
                </div>
                )) : <p className="text-sm text-muted-foreground">No slots selected.</p>}
              </div>
              
              <div>
                <h4 className="font-semibold mb-2 border-b pb-1">Add-Ons</h4>
                 {addons.length > 0 ? addons.map((item) => (
                    <div key={item.id} className="flex justify-between py-1 text-sm">
                        <span className="font-medium">{item.name} (x{item.quantity})</span>
                        <span className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                )) : <p className="text-sm text-muted-foreground">No add-ons selected.</p>}
              </div>

            </div>
        </CardContent>
        <CardFooter className="flex-col items-start gap-4 p-4 bg-slate-50 dark:bg-slate-900/50">
             <div className="flex justify-between w-full font-bold text-lg">
                <span>Total Amount:</span>
                <span>₹{totalAmount.toFixed(2)}</span>
             </div>
            
            {venue?.paymentMethod === 'without-payment' ? (
              <>
                <Button 
                  onClick={handleBookingWithoutPayment} 
                  className="w-full mt-2 font-bold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700" 
                  disabled={isProcessing || slots.length === 0}
                  size="lg"
                >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin"/> 
                        Confirming...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Confirm Booking (Free)
                      </>
                    )}
                </Button>
                <p className="text-xs text-muted-foreground w-full text-center">
                  No payment required. Booking will be confirmed immediately.
                </p>
              </>
            ) : (
              <>
                <Button 
                  onClick={handlePayment} 
                  className="w-full mt-2 font-bold" 
                  disabled={isProcessing || slots.length === 0}
                  size="lg"
                >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin"/> 
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Proceed to Pay
                      </>
                    )}
                </Button>
                <p className="text-xs text-muted-foreground w-full text-center">
                  Secure payment powered by Razorpay
                </p>
              </>
            )}
        </CardFooter>
    </Card>
  );
}
