import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gem } from "lucide-react";

export default function LoyaltyPage() {
  return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline">
            <Gem className="h-6 w-6 text-primary" />
            Loyalty Program
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This is a placeholder for the loyalty program page. Your points and tier status will be shown here.
          </p>
        </CardContent>
      </Card>
  );
}
