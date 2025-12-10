
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc, updateDocumentNonBlocking } from "@/firebase";
import { collection, query, where, orderBy, doc, Timestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Shield, Trash2 } from "lucide-react";
import type { Booking, UserProfile } from "@/lib/types";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast";

function BookingList() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, "users", user.uid);
    }, [firestore, user]);

    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

    const bookingsQuery = useMemoFirebase(() => {
        if (!firestore || !user) {
            return null;
        }
        return query(
            collection(firestore, "bookings"),
            where("uid", "==", user.uid),
            orderBy("createdAt", "desc")
        );
    }, [firestore, user]);

    const { data: bookings, isLoading: isBookingsLoading, error } = useCollection<Booking>(bookingsQuery);

    const handleCancelBooking = (bookingId: string) => {
        if (!firestore) return;
        const bookingRef = doc(firestore, 'bookings', bookingId);
        updateDocumentNonBlocking(bookingRef, { status: 'cancelled' });
        toast({
            title: "Booking Cancelled",
            description: `Your booking has been cancelled.`
        })
    }

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
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {bookings?.map((booking) => (
                    <TableRow key={booking.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground">#{booking.id.substring(0,7)}</TableCell>
                        <TableCell className="font-medium">
                            {booking.createdAt instanceof Timestamp ? format(booking.createdAt.toDate(), 'PPP') : 'N/A'}
                        </TableCell>
                        <TableCell>RS.{booking.totalAmount.toFixed(2)}</TableCell>
                        <TableCell>
                            <Badge variant={booking.status === 'paid' ? 'default' : booking.status === 'cancelled' || booking.status === 'failed' ? 'destructive' : 'secondary'}>
                                {booking.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" disabled={booking.status !== 'pending'}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will cancel your booking. This action cannot be undone.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Back</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleCancelBooking(booking.id)}>Confirm Cancellation</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
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
