
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, isValid } from "date-fns";
import { CalendarDays, Shield, AlertCircle } from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, where, orderBy, limit, doc, Timestamp } from "firebase/firestore";
import type { Booking, UserProfile } from "@/lib/types";
import { Skeleton } from "../ui/skeleton";
import Link from "next/link";
import { Button } from "../ui/button";

export function RecentBookings() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  // Step 1: Get the user's profile to determine their role.
  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  // Step 2: Only create the bookings query if the user is loaded and confirmed to be a regular 'user'.
  const bookingsQuery = useMemoFirebase(() => {
      // This query should ONLY be created if we have a user who is confirmed to be a regular user.
      if (!firestore || !user || !userProfile || userProfile.role !== 'user') {
        return null; 
      }
      return query(
          collection(firestore, "bookings"),
          where("userId", "==", user.uid),
          orderBy("bookingDate", "desc"),
          limit(3)
      );
  }, [firestore, user, userProfile]);

  // Step 3: Fetch the bookings. This hook will do nothing if the query is null.
  const { data: bookings, isLoading: isBookingsLoading, error } = useCollection<Booking>(bookingsQuery);

  const hasBookings = bookings && bookings.length > 0;
  const isLoading = isUserLoading || isProfileLoading;

  if (isLoading) {
      return (
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                        <CalendarDays />
                        Recent Bookings
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </CardContent>
            </Card>
      )
  }
  
  if (error) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <CalendarDays />
                    Recent Bookings
                </CardTitle>
            </CardHeader>
            <CardContent className="text-center py-10 text-destructive flex flex-col items-center gap-2">
                <AlertCircle />
                <p className="text-sm">Could not load recent bookings.</p>
                <p className="text-xs text-muted-foreground">{error.message}</p>
            </CardContent>
        </Card>
    );
  }

  // Step 4: Explicitly handle the different states (admin, logged out, no bookings).
  
  // Display admin-specific view.
  if (userProfile?.role === 'admin') {
    return (
       <Card>
        <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
                <CalendarDays />
                Recent Bookings
            </CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground py-8">
            <Shield className="mx-auto h-8 w-8 mb-2 text-primary" />
            <p className="font-semibold">Admin View</p>
            <p className="text-sm">Welcome, Admin!</p>
            <Button asChild variant="link" className="mt-2">
                <Link href="/admin">Go to Admin Dashboard</Link>
            </Button>
        </CardContent>
      </Card>
    )
  }

  // Display for logged-out users.
  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
              <CalendarDays />
              Recent Bookings
          </CardTitle>
          <CardDescription>Your 3 most recent bookings.</CardDescription>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground py-8">
            <p>Log in to see your bookings.</p>
             <Button asChild variant="link">
                <Link href="/login">Login</Link>
            </Button>
        </CardContent>
      </Card>
    );
  }

  // Display bookings or loading state for a regular user.
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
            <CalendarDays />
            Recent Bookings
        </CardTitle>
        <CardDescription>Your 3 most recent bookings.</CardDescription>
      </CardHeader>
      <CardContent>
        {isBookingsLoading && bookingsQuery ? (
             <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        ) : hasBookings ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium">
                     {booking.bookingDate instanceof Timestamp && isValid(booking.bookingDate.toDate())
                          ? format(booking.bookingDate.toDate(), "MMM dd, yyyy")
                          : 'Processing...'}
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
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <p>You have no recent bookings.</p>
            <p className="text-sm">Book a slot to get started!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
