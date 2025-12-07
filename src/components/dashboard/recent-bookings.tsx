
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, isValid } from "date-fns";
import { CalendarDays, Shield, AlertCircle } from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, where, orderBy, limit, doc } from "firebase/firestore";
import type { Booking, UserProfile } from "@/lib/types";
import { Skeleton } from "../ui/skeleton";
import Link from "next/link";
import { Button } from "../ui/button";

export function RecentBookings() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  // This is the definitive fix. The query is ONLY constructed if we have confirmed the user's role is 'user'.
  // This prevents any query from being made for an admin or while the profile is loading.
  const bookingsQuery = useMemoFirebase(() => {
      if (!firestore || !user || isProfileLoading || !userProfile || userProfile.role !== 'user') {
        return null; 
      }
      return query(
          collection(firestore, "bookings"),
          where("userId", "==", user.uid),
          orderBy("bookingDate", "desc"),
          limit(3)
      );
  }, [firestore, user, userProfile, isProfileLoading]);

  const { data: bookings, isLoading: isBookingsLoading, error } = useCollection<Booking>(bookingsQuery);

  const hasBookings = bookings && bookings.length > 0;
  // The primary loading state depends on user auth and profile loading.
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

  // If the user is an admin, show a specific admin view.
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
            <p className="text-sm">All bookings managed on admin dashboard.</p>
            <Button asChild variant="link" className="mt-2">
                <Link href="/admin">Go to Admin Dashboard</Link>
            </Button>
        </CardContent>
      </Card>
    )
  }

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
        {!user ? (
            <div className="text-center text-muted-foreground py-8">
                <p>Log in to see your bookings.</p>
                 <Button asChild variant="link">
                    <Link href="/login">Login</Link>
                </Button>
            </div>
        // Show skeleton only if we are in a state where a query should be running.
        ) : isBookingsLoading && bookingsQuery ? (
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
                     {booking.bookingDate && isValid(booking.bookingDate.toDate())
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
