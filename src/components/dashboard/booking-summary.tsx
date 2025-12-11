
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getFunctions, httpsCallable } from 'firebase/functions';
import type { Slot } from '@/lib/types';
import { useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Ticket, Loader2, CreditCard } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
  slots: Slot[];
}

declare global {
    interface Window {
        Razorpay: any;
    }
}

export function BookingSummary({ slots }: Props) {
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const totalAmount = slots.reduce((sum, slot) => sum + (slot.price || 0), 0);
  const hasPending = slots.some(s => s.status === 'pending');

  const handleBooking = async () => {
      if (!user) {
          toast({ variant: 'destructive', title: "Not logged in" });
          return;
      }
      setIsProcessing(true);

      try {
        const functions = getFunctions();
        const createRazorpayOrder = httpsCallable(functions, 'createRazorpayOrder');
        const result: any = await createRazorpayOrder({ slots: slots.map(s => ({ id: s.id, startAt: s.startAt, endAt: s.endAt, durationMins: s.durationMins })), totalAmount });

        if (hasPending) {
            toast({ title: 'Proposal Submitted', description: 'Your custom slot request is now pending admin approval.'});
            // maybe redirect to a "my requests" page
            router.push('/bookings');
        } else {
            // All slots were available, proceed to payment
            const { orderId, bookingId } = result.data;
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: totalAmount * 100,
                currency: "INR",
                name: "AVIT Cricket Booker",
                description: `Booking ID: ${bookingId}`,
                order_id: orderId,
                handler: function (response: any) {
                    toast({ title: "Payment Successful!", description: "Your booking is confirmed." });
                    // Webhook will handle the rest
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
                            description: 'Your slots have been released.',
                        });
                    }
                }
            };
            const rzp = new window.Razorpay(options);
            rzp.open();
        }
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Booking Failed', description: error.message || 'An unexpected error occurred.' });
      } finally {
          setIsProcessing(false);
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
                <div className="space-y-2">
                {slots.map((slot, i) => (
                <div key={slot.id || `pending-${i}`} className="flex justify-between py-1 text-sm">
                    <div className="flex flex-col">
                        <span className="font-medium">{new Date(slot.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(slot.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({slot.durationMins} mins)</span>
                        {slot.status === 'pending' && <Badge variant="outline" className="w-fit text-yellow-600 border-yellow-500">Pending Approval</Badge>}
                    </div>
                    <span className="font-semibold">₹{slot.price}</span>
                </div>
                ))}
                </div>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 p-4 bg-slate-50 dark:bg-slate-900/50">
                <div className="flex justify-between w-full font-bold text-lg">
                    <span>Total:</span>
                    <span>₹{totalAmount.toFixed(2)}</span>
                </div>
                {hasPending && <p className="text-xs text-yellow-600 mt-2">Your booking will be confirmed after admin approval.</p>}
                <Button onClick={handleBooking} className="w-full mt-2 font-bold" disabled={isProcessing}>
                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : (hasPending ? <CreditCard className="mr-2 h-4 w-4" /> : null)}
                    {hasPending ? 'Submit Proposal' : 'Proceed to Pay'}
                </Button>
            </CardFooter>
        </Card>
    </div>
  );
}

    