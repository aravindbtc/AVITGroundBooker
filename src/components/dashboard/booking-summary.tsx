
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getFunctions, httpsCallable } from 'firebase/functions';
import type { BookingItem, Slot } from '@/lib/types';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Ticket, Loader2, CreditCard } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
  slots: Slot[];
  addons: BookingItem[];
  onBookingSuccess: () => void;
}

declare global {
    interface Window {
        Razorpay: any;
    }
}

export function BookingSummary({ slots, addons, onBookingSuccess }: Props) {
  const { user } = useUser();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Prices will be recalculated on the server, this is just for display
  const totalAmount = slots.reduce((sum, slot) => sum + (slot.price || 0), 0) + addons.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleBooking = async () => {
      if (!user) {
          toast({ variant: 'destructive', title: "Not logged in", description: "You must be logged in to book a slot." });
          return;
      }
      setIsProcessing(true);

      try {
        const functions = getFunctions();
        const createRazorpayOrder = httpsCallable(functions, 'createRazorpayOrder');
        
        // The server will calculate the final price
        const result: any = await createRazorpayOrder({ slots, addons });

        const { orderId, bookingId, totalAmount: serverTotal } = result.data;

        const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            amount: serverTotal * 100, // Use server-calculated amount
            currency: "INR",
            name: "AVIT Cricket Booker",
            description: `Booking for ${user.displayName || user.email}`,
            order_id: orderId,
            handler: function (response: any) {
                toast({ title: "Payment Successful!", description: "Your booking is confirmed." });
                onBookingSuccess();
            },
            prefill: {
                name: user.displayName || "User",
                email: user.email,
            },
            notes: {
                bookingId: bookingId,
                userId: user.uid,
            },
            theme: {
                color: "#10B981"
            },
             modal: {
                ondismiss: function() {
                    toast({
                        variant: 'destructive',
                        title: 'Payment Cancelled',
                        description: 'Your booking has been cancelled and the slots are released.',
                    });
                    // Webhook logic will handle deleting the transient slots
                }
            }
        };
        const rzp = new window.Razorpay(options);
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
            <div className="space-y-2">
            {slots.map((slot, i) => (
            <div key={`slot-${i}`} className="flex justify-between py-1 text-sm">
                <div className="flex flex-col">
                    <span className="font-medium">{new Date(slot.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(slot.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="text-xs text-muted-foreground">({slot.durationMins} mins)</span>
                </div>
                {/* Price is calculated on server, so we omit it here to avoid confusion */}
            </div>
            ))}
            {addons.map((item) => (
                 <div key={item.id} className="flex justify-between py-1 text-sm">
                    <span className="font-medium">{item.name} (x{item.quantity})</span>
                    <span className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
            ))}
            </div>
        </CardContent>
        <CardFooter className="flex-col items-start gap-2 p-4 bg-slate-50 dark:bg-slate-900/50">
             {/* The total is indicative and will be finalized on the server */}
            <p className="text-xs text-muted-foreground w-full text-center mb-2">Total will be calculated and verified upon payment.</p>
            <Button onClick={handleBooking} className="w-full mt-2 font-bold" disabled={isProcessing || slots.length === 0}>
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CreditCard className="mr-2 h-4 w-4" />}
                Proceed to Pay
            </Button>
        </CardFooter>
    </Card>
  );
}
