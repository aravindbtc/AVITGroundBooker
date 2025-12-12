
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { BookingSummary } from '@/components/dashboard/booking-summary';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function CartPageContents() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [cartData, setCartData] = useState<{ slots: any[], addons: any[] } | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const dataParam = searchParams.get('data');
        if (dataParam) {
            try {
                const parsedData = JSON.parse(decodeURIComponent(dataParam));
                if (parsedData.slots || parsedData.addons) {
                    setCartData(parsedData);
                } else {
                    throw new Error("Invalid cart data structure.");
                }
            } catch (e) {
                console.error("Failed to parse cart data:", e);
                setError("Could not load your cart. The link may be invalid.");
            }
        } else {
             setError("Your cart is empty.");
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
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        {error}
                        <Button asChild variant="link" className="p-0 h-auto mt-2">
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

