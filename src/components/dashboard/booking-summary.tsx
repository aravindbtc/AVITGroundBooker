
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
  slots: any[]; // Using any to handle ISO string dates from query param
  addons: BookingItem[];
  onBookingSuccess: () => void;
}

export function BookingSummary({ slots, addons, onBookingSuccess }: Props) {
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const totalSlotPrice = slots.reduce((sum, slot) => sum + slot.price, 0);

  const totalAddonPrice = addons.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const totalAmount = totalSlotPrice + totalAddonPrice;

  const handleBooking = async () => {
      if (!user) {
          toast({ variant: 'destructive', title: "Not logged in", description: "You must be logged in to book a slot." });
          return;
      }
      setIsProcessing(true);

      try {
        const functions = getFunctions();
        const bookSlotDirectly = httpsCallable(functions, 'createRazorpayOrder'); 
        
        // Ensure dates are sent as ISO strings, as the backend function expects.
        const bookingData = {
          slots: slots.map(slot => ({
            ...slot,
            startAt: new Date(slot.startAt).toISOString(),
            endAt: new Date(slot.endAt).toISOString(),
          })),
          addons,
        };

        const result: any = await bookSlotDirectly(bookingData);

        toast({ title: "Booking Successful!", description: "Your booking is confirmed." });
        onBookingSuccess();
        router.push(`/bookings?id=${result.data.bookingId}`); // Redirect to bookings page on success

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
            <Button onClick={handleBooking} className="w-full mt-2 font-bold" disabled={isProcessing || slots.length === 0}>
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CreditCard className="mr-2 h-4 w-4" />}
                Proceed to Pay
            </Button>
        </CardFooter>
    </Card>
  );
}
