import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { mockBookings } from "@/lib/data";
import { format } from "date-fns";
import { CalendarDays } from "lucide-react";

export function RecentBookings() {
  const hasBookings = mockBookings.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
            <CalendarDays />
            Recent Bookings
        </CardTitle>
        <CardDescription>Your past 3 bookings.</CardDescription>
      </CardHeader>
      <CardContent>
        {hasBookings ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockBookings.slice(0, 3).map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium">{format(booking.date, "MMM dd")}</TableCell>
                  <TableCell>{booking.startTime} - {booking.endTime}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={booking.status === 'Confirmed' ? 'default' : 'secondary'} className="bg-primary/20 text-primary-foreground hover:bg-primary/30 border-primary/30">
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
