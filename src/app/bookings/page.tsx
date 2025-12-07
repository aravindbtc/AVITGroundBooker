
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, where, orderBy, doc, Timestamp } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Shield } from "lucide-react";
import type { Booking, UserProfile } from "@/lib/types";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function BookingList() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, "users", user.uid);
    }, [firestore, user]);

    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

    const bookingsQuery = useMemoFirebase(() => {
        // Query should ONLY be created if we have a user who is NOT an admin.
        if (!firestore || !user || !userProfile || userProfile.role !== 'user') {
            return null;
        }
        return query(
            collection(firestore, "bookings"),
            where("userId", "==", user.uid),
            orderBy("bookingDate", "desc")
        );
    }, [firestore, user, userProfile]);

    const { data: bookings, isLoading: isBookingsLoading, error } = useCollection<Booking>(bookingsQuery);

    const isLoading = isUserLoading || isProfileLoading;

    if (isLoading) {
        return (
            <div className="space-y-2 p-6">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        );
    }
    
    if (!user) {
        return (
            <div className="text-center py-10">
                <p className="text-muted-foreground mb-4">Please log in to see your bookings.</p>
                 <Button asChild>
                    <Link href="/login">Login</Link>
                </Button>
            </div>
        )
    }

    // Explicitly handle admin view. This component should not be visible for admins.
    if (userProfile?.role === 'admin') {
        return (
             <div className="text-center py-10">
                <Shield className="mx-auto h-12 w-12 text-primary mb-4" />
                <h3 className="text-lg font-semibold">Admin View</h3>
                <p className="text-muted-foreground mb-4">All user bookings are managed on the Admin Dashboard.</p>
                 <Button asChild>
                    <Link href="/admin">Go to Admin Dashboard</Link>
                </Button>
            </div>
        )
    }

    if (error) {
        return (
            <div className="text-center py-10 text-destructive flex flex-col items-center gap-2">
                <AlertCircle />
                <p>Could not load bookings.</p>
                <p className="text-sm">{error.message}</p>
            </div>
        );
    }

    // Show loading skeleton only when we expect bookings to be loading.
    if (isBookingsLoading && bookingsQuery) {
        return (
             <div className="space-y-2 p-6">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        )
    }

    if (!bookings || bookings.length === 0) {
        return (
            <div className="text-center py-10">
                <p className="text-muted-foreground">You have no bookings yet.</p>
                 <Button asChild className="mt-4">
                    <Link href="/">Book a Slot</Link>
                </Button>
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Booking ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {bookings?.map((booking) => (
                    <TableRow key={booking.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground">#{booking.id.substring(0,7)}</TableCell>
                        <TableCell className="font-medium">
                            {booking.bookingDate instanceof Timestamp ? format(booking.bookingDate.toDate(), 'PPP') : 'N/A'}
                        </TableCell>
                        <TableCell>RS.{booking.total.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                            <Badge variant={booking.status === 'paid' ? 'default' : 'secondary'}>
                                {booking.status}
                            </Badge>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}


export default function BookingsPage() {
    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold font-headline">My Bookings</h1>
                <p className="text-muted-foreground">A history of all your ground bookings.</p>
            </div>
            <Card>
                <CardContent className="p-0">
                   <BookingList />
                </CardContent>
            </Card>
        </div>
    );
}
