"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Wand2 } from "lucide-react";
import { weatherAwareRescheduling, WeatherAwareReschedulingOutput } from "@/ai/flows/weather-aware-rescheduling";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required."),
  userId: z.string().min(1, "User ID is required."),
  weatherForecast: z.string().min(10, "Weather forecast is required."),
  pastPreferences: z.string().min(10, "Past preferences are required."),
  groundAvailability: z.string().min(10, "Ground availability is required."),
});

export function WeatherReschedule() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<WeatherAwareReschedulingOutput | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bookingId: "BK001",
      userId: "USR-042",
      weatherForecast: "Chennai, tomorrow: 80% chance of heavy rain between 4 PM - 7 PM. Sunny in the morning.",
      pastPreferences: "User prefers weekend evenings (Sat/Sun 5 PM - 8 PM) or weekday mornings (7 AM - 9 AM).",
      groundAvailability: "This week: Sat 7-9 AM available. Sun 6-8 PM available. Next week: Mon 7-9 AM available, Sat 5-7 PM available.",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    try {
      const res = await weatherAwareRescheduling(values);
      setResult(res);
      setIsDialogOpen(true);
    } catch (error) {
      console.error("AI rescheduling failed:", error);
      toast({
        variant: "destructive",
        title: "AI Error",
        description: "Could not get a rescheduling suggestion. Please try again."
      })
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><Wand2 /> AI Weather-Aware Rescheduling</CardTitle>
          <CardDescription>Rain in the forecast? Let our AI find the best alternative slot for you based on weather, your habits, and ground availability.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="bookingId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Booking ID</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>User ID</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="weatherForecast"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weather Forecast</FormLabel>
                    <FormControl><Textarea {...field} rows={3} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pastPreferences"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User Preferences</FormLabel>
                    <FormControl><Textarea {...field} rows={3} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="groundAvailability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ground Availability</FormLabel>
                    <FormControl><Textarea {...field} rows={3} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                Find New Slot
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-headline flex items-center gap-2"><Wand2 /> Reschedule Suggestion</DialogTitle>
            
          </DialogHeader>
          {result && (
            <div className="space-y-4 py-4">
                <div>
                    <h4 className="font-semibold text-muted-foreground">Suggested New Time:</h4>
                    <p className="text-primary font-bold text-lg">{result.rescheduleSuggestion}</p>
                </div>
                <div>
                    <h4 className="font-semibold text-muted-foreground">Reasoning:</h4>
                    <p className="text-sm">{result.reasoning}</p>
                </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsDialogOpen(false)}>Accept Suggestion</Button>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
