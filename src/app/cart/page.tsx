
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { BookingSummary } from '@/components/dashboard/booking-summary';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { CartData } from '@/lib/types';

function CartPageContents() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [cartData, setCartData] = useState<CartData | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const dataParam = searchParams.get('data');
        if (dataParam) {
            try {
                const parsedData: CartData = JSON.parse(decodeURIComponent(dataParam));
                
                // Validate slots are properly formatted
                if (!Array.isArray(parsedData.slots) || parsedData.slots.length === 0) {
                    throw new Error('Invalid cart: no slots selected');
                }
                
                for (const slot of parsedData.slots) {
                    if (!slot.startAt || !slot.endAt) {
                        throw new Error('Invalid slot data: missing time information');
                    }
                    // Validate ISO date format
                    const startDate = new Date(slot.startAt);
                    const endDate = new Date(slot.endAt);
                    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                        throw new Error('Invalid slot dates: unable to parse');
                    }
                    if (endDate <= startDate) {
                        throw new Error('Invalid slot times: end time must be after start time');
                    }
                }
                
                setCartData(parsedData);
            } catch (e) {
                console.error("Failed to parse cart data:", e);
                const errorMessage = e instanceof Error ? e.message : 'Could not load your cart';
                setError(errorMessage);
            }
        } else {
            setError("Your cart is empty. Please select slots to continue.");
        }
    }, [searchParams]);

    const handleBookingSuccess = () => {
        // The booking summary will handle redirection.
        // This function can be used for cleanup if needed in the future.
    };

    if (error) {
        return (
             <div className="w-full max-w-md mx-auto">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Unable to Load Cart</AlertTitle>
                    <AlertDescription className="mt-2 space-y-3">
                        <p>{error}</p>
                        <Button asChild variant="outline">
                           <Link href="/">Return to Dashboard</Link>
                        </Button>
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    if (!cartData) {
        return (
            <div className="flex justify-center items-center p-10">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto text-muted-foreground" />
                    <p className="mt-4 text-muted-foreground">Loading your cart...</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="w-full max-w-md mx-auto space-y-6">
             <div className="space-y-1 text-center">
                <h1 className="text-3xl font-bold font-headline">My Cart</h1>
                <p className="text-muted-foreground">Review your items and proceed to payment.</p>
            </div>
            <BookingSummary 
                slots={cartData.slots} 
                addons={cartData.addons} 
                onBookingSuccess={handleBookingSuccess}
            />
        </div>
    );
}

export default function CartPage() {
    return (
        <Suspense fallback={<div>Loading Cart...</div>}>
            <CartPageContents />
        </Suspense>
    )
}

