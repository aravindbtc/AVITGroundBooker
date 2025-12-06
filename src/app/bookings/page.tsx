
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, AlertCircle } from "lucide-react";
import type { Booking } from "@/lib/types";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function BookingList() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const bookingsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, "bookings"),
            where("userId", "==", user.uid),
            orderBy("bookingDate", "desc")
        );
    }, [firestore, user]);

    const { data: bookings, isLoading, error } = useCollection<Booking>(bookingsQuery);

    if (isUserLoading || (isLoading && !bookings)) {
        return (
            <div className="space-y-2">
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

    if (error) {
        return (
            <div className="text-center py-10 text-destructive flex flex-col items-center gap-2">
                <AlertCircle />
                <p>Could not load bookings.</p>
                <p className="text-sm">{error.message}</p>
            </div>
        );
    }

    if (bookings?.length === 0) {
        return (
            <div className="text-center py-10">
                <p className="text-muted-foreground">You have no bookings yet.</p>
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
                            {booking.bookingDate ? format(booking.bookingDate.toDate(), 'PPP') : 'N/A'}
                        </TableCell>
                        <TableCell>RS.{booking.total.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                            <Badge variant={booking.status === 'Confirmed' ? 'default' : 'secondary'}>
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
