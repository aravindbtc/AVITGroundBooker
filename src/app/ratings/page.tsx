
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc, Timestamp, addDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Star, ThumbsUp } from 'lucide-react';
import type { Booking, Rating, Slot } from '@/lib/types';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

function StarRating({
  count = 5,
  rating,
  onRatingChange,
  disabled = false,
}: {
  count?: number;
  rating: number;
  onRatingChange: (newRating: number) => void;
  disabled?: boolean;
}) {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[...Array(count)].map((_, index) => {
        const starValue = index + 1;
        return (
          <Star
            key={index}
            className={`cursor-pointer h-6 w-6 transition-colors ${
              starValue <= (hoverRating || rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'
            } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
            onClick={() => !disabled && onRatingChange(starValue)}
            onMouseEnter={() => !disabled && setHoverRating(starValue)}
            onMouseLeave={() => !disabled && setHoverRating(0)}
          />
        );
      })}
    </div>
  );
}

function RatingCard({ booking }: { booking: Booking }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [slotData, setSlotData] = useState<Slot | null>(null);
  const [isLoadingSlot, setIsLoadingSlot] = useState(true);

  // Ratings state: an object to hold ratings for ground and each addon
  const [ratings, setRatings] = useState<Record<string, number>>({});
  // Submitted state
  const [submittedRatings, setSubmittedRatings] = useState<Record<string, number>>({});
  
  const ratingsQuery = useMemoFirebase(() => {
    if (!firestore || !booking.id) return null;
    return query(collection(firestore, "ratings"), where("bookingId", "==", booking.id));
  }, [firestore, booking.id]);

  const { data: existingRatings } = useCollection<Rating>(ratingsQuery);

  useEffect(() => {
    if (existingRatings) {
      const submitted = existingRatings.reduce((acc, rating) => {
        acc[rating.ratedItemId] = rating.rating;
        return acc;
      }, {} as Record<string, number>);
      setSubmittedRatings(submitted);
      setRatings(submitted);
    }
  }, [existingRatings]);

  const mainSlotRef = useMemoFirebase(() => {
      if (!firestore || !booking.slots || booking.slots.length === 0) return null;
      return doc(firestore, 'slots', booking.slots[0]);
  }, [firestore, booking.slots]);

  const { data: mainSlot, isLoading } = useDoc<Slot>(mainSlotRef);

  const isBookingComplete = mainSlot?.endAt instanceof Timestamp ? mainSlot.endAt.toDate() < new Date() : false;
  
  const handleRatingChange = (itemId: string, newRating: number) => {
    setRatings(prev => ({ ...prev, [itemId]: newRating }));
  };

  const handleSaveRating = async (itemId: string, itemType: 'ground' | 'item' | 'manpower') => {
    if (!firestore || !user || !booking.id) return;
    const ratingValue = ratings[itemId];
    if (!ratingValue) {
        toast({ variant: 'destructive', title: 'No rating selected' });
        return;
    }

    try {
        await addDoc(collection(firestore, 'ratings'), {
            bookingId: booking.id,
            userId: user.uid,
            ratedItemId: itemId,
            ratedItemType: itemType,
            rating: ratingValue,
            createdAt: serverTimestamp(),
        });
        toast({ title: 'Rating submitted!', description: 'Thank you for your feedback.'});
    } catch(e) {
        console.error("Failed to save rating:", e);
        toast({ variant: 'destructive', title: 'Submission Failed', description: 'Could not save your rating.'});
    }
  }

  if (isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (!mainSlot) {
      return null; // Don't render card if main slot data isn't available
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Booking on {format(mainSlot.startAt.toDate(), 'PPP')}</CardTitle>
        <CardDescription>
          Slot from {format(mainSlot.startAt.toDate(), 'p')} to {format(mainSlot.endAt.toDate(), 'p')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isBookingComplete && (
            <div className="text-center p-4 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
                You can rate this session after it is completed.
            </div>
        )}

        <div className="space-y-3">
          {/* Ground Rating */}
          <div className="flex justify-between items-center">
            <span className="font-semibold">Cricket Ground</span>
            <div className="flex items-center gap-2">
                <StarRating 
                    rating={ratings['avit-ground'] || 0}
                    onRatingChange={(newRating) => handleRatingChange('avit-ground', newRating)}
                    disabled={!isBookingComplete || !!submittedRatings['avit-ground']}
                />
                <Button 
                    size="sm" 
                    onClick={() => handleSaveRating('avit-ground', 'ground')}
                    disabled={!isBookingComplete || !ratings['avit-ground'] || !!submittedRatings['avit-ground']}>
                    {submittedRatings['avit-ground'] ? <ThumbsUp className="h-4 w-4" /> : 'Save'}
                </Button>
            </div>
          </div>
          
          <Separator />

          {/* Addons Ratings */}
          {booking.addons && booking.addons.length > 0 && (
            <div className="space-y-3 pt-2">
                <h4 className="font-semibold">Add-ons</h4>
                {booking.addons.map(addon => (
                     <div key={addon.id} className="flex justify-between items-center">
                        <span className="font-medium">{addon.name}</span>
                        <div className="flex items-center gap-2">
                             <StarRating 
                                rating={ratings[addon.id] || 0}
                                onRatingChange={(newRating) => handleRatingChange(addon.id, newRating)}
                                disabled={!isBookingComplete || !!submittedRatings[addon.id]}
                            />
                            <Button 
                                size="sm" 
                                onClick={() => handleSaveRating(addon.id, addon.type)}
                                disabled={!isBookingComplete || !ratings[addon.id] || !!submittedRatings[addon.id]}>
                                {submittedRatings[addon.id] ? <ThumbsUp className="h-4 w-4" /> : 'Save'}
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function RatingsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const bookingsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'bookings'),
      where('uid', '==', user.uid),
      where('status', '==', 'paid'), // Only rate paid bookings
      // Sort by booking date descending
    );
  }, [firestore, user]);

  const { data: bookings, isLoading, error } = useCollection<Booking>(bookingsQuery);

  const sortedBookings = useMemo(() => {
    if (!bookings) return [];
    return [...bookings].sort((a,b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
  }, [bookings])


  if (isUserLoading || (isLoading && !bookings)) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 text-destructive flex flex-col items-center gap-2">
        <AlertCircle />
        <p>Could not load your bookings for rating.</p>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold font-headline">Provide Ratings</h1>
        <p className="text-muted-foreground">Rate your experience for completed bookings.</p>
      </div>
      <div className="space-y-6">
        {bookings && bookings.length > 0 ? (
          sortedBookings.map(booking => <RatingCard key={booking.id} booking={booking} />)
        ) : (
          <Card>
            <CardContent className="p-10 text-center">
              <p className="text-muted-foreground">You have no completed bookings to rate yet.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
