import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";

export default function AdminPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline">
            <ShieldAlert className="h-6 w-6 text-primary" />
            Admin Panel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This is a placeholder for the admin dashboard. Full management capabilities for users, bookings, and venue settings will be available here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
