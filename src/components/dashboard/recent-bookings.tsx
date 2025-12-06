
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CalendarDays } from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy, limit } from "firebase/firestore";
import type { Booking } from "@/lib/types";
import { Skeleton } from "../ui/skeleton";
import Link from "next/link";
import { Button } from "../ui/button";

export function RecentBookings() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const bookingsQuery = useMemoFirebase(() => {
      if (!firestore || !user) return null;
      return query(
          collection(firestore, "bookings"),
          where("userId", "==", user.uid),
          orderBy("bookingDate", "desc"),
          limit(3)
      );
  }, [firestore, user]);

  const { data: bookings, isLoading } = useCollection<Booking>(bookingsQuery);

  const hasBookings = bookings && bookings.length > 0;

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
        {isUserLoading || isLoading ? (
            <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        ) : !user ? (
            <div className="text-center text-muted-foreground py-8">
                <p>Log in to see your bookings.</p>
                 <Button asChild variant="link">
                    <Link href="/login">Login</Link>
                </Button>
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
                  <TableCell className="font-medium">{format(booking.bookingDate.toDate(), "MMM dd, yyyy")}</TableCell>
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
