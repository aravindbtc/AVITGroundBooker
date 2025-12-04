import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";

export default function BookingsPage() {
  return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline">
            <CalendarDays className="h-6 w-6 text-primary" />
            My Bookings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This is a placeholder for your bookings. Your upcoming and past bookings will be displayed here.
          </p>
        </CardContent>
      </Card>
  );
}
