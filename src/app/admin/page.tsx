
"use client"
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Addon, Manpower, Booking } from '@/lib/types';
import { ShieldAlert, Save, CalendarPlus, Loader2, AlertCircle, CalendarDays } from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { writeBatch, doc, collection, Timestamp, query, orderBy } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { VenueManagement } from '@/components/admin/venue-management';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';


function SlotGenerator() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const generateSlots = async () => {
        setIsLoading(true);
        toast({
            title: "Generating Slots...",
            description: "Please wait while we create slots for the next 30 days.",
        });

        try {
            const functions = getFunctions();
            const generateSlotsFn = httpsCallable(functions, 'generateSlots');
            const result = await generateSlotsFn({ days: 30 });
            
            toast({
                title: "Success!",
                description: (result.data as any).message || "Time slots have been generated.",
            });
        } catch (error: any) {
            console.error("Error generating slots:", error);
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: error.message || "Could not generate time slots. Please try again.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="shadow-lg rounded-xl">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline">
                    <CalendarPlus className="h-6 w-6 text-primary" />
                    Generate Time Slots
                </CardTitle>
                <CardDescription>
                    Populate the database with available time slots for booking. This will generate hourly slots from 5 AM to 10 PM for the next 30 days. This can be re-run safely.
                </CardDescription>
            </CardHeader>
            <CardFooter>
                <Button onClick={generateSlots} disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <CalendarPlus className="mr-2 h-4 w-4" />
                            Generate Next 30 Days
                        </>
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
}

function PriceStockManagement() {
    const firestore = useFirestore();
    const { toast } = useToast();

    const accessoriesQuery = useMemoFirebase(() => firestore && collection(firestore, 'accessories'), [firestore]);
    const { data: allItemsData, isLoading: accessoriesLoading } = useCollection<(Addon | Manpower)>(accessoriesQuery);
    
    const [items, setItems] = useState<(Addon | Manpower)[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (allItemsData) setItems(allItemsData);
    }, [allItemsData]);

    const handleItemUpdate = (id: string, field: 'price' | 'stock', value: string) => {
        const numValue = parseInt(value, 10);
        if (isNaN(numValue) || numValue < 0) return;
        setItems(current => current.map(a => a.id === id ? { ...a, [field]: numValue } : a));
    };
    
    const handleSaveChanges = async () => {
        if (!firestore) return;
        setIsSaving(true);
        toast({ title: "Saving changes..." });

        try {
            const batch = writeBatch(firestore);

            items.forEach(item => {
                const docRef = doc(firestore, 'accessories', item.id);
                batch.update(docRef, { price: item.price, stock: item.stock });
            });

            await batch.commit();
            toast({ title: "Success!", description: "All changes have been saved." });
        } catch (error) {
            console.error("Error saving changes:", error);
            toast({ variant: 'destructive', title: "Error", description: "Could not save changes." });
        } finally {
            setIsSaving(false);
        }
    };
    
    const accessories = items.filter(item => item.type === 'item');
    const manpower = items.filter(item => item.type === 'manpower');

    return (
         <Card className="w-full max-w-4xl mx-auto shadow-lg rounded-xl">
            <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
                <ShieldAlert className="h-6 w-6 text-primary" />
                Price & Stock Management
            </CardTitle>
            </CardHeader>
            <CardContent>
            {accessoriesLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                </div>
            ) : (
                <>
                <Tabs defaultValue="accessories">
                    <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="accessories">Accessories</TabsTrigger>
                    <TabsTrigger value="manpower">Manpower</TabsTrigger>
                    </TabsList>
                    <TabsContent value="accessories">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead>Price (RS.)</TableHead>
                            <TableHead>Stock</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {accessories.map((addon) => (
                            <TableRow key={addon.id}>
                            <TableCell className="font-medium flex items-center gap-2">
                                {addon.name}
                            </TableCell>
                            <TableCell>
                                <Input
                                type="number"
                                value={addon.price}
                                onChange={(e) => handleItemUpdate(addon.id, 'price', e.target.value)}
                                className="h-9 w-24"
                                />
                            </TableCell>
                            <TableCell>
                                <Input
                                type="number"
                                value={addon.stock}
                                onChange={(e) => handleItemUpdate(addon.id, 'stock', e.target.value)}
                                className="h-9 w-24"
                                />
                            </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                    </TabsContent>
                    <TabsContent value="manpower">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Service</TableHead>
                            <TableHead>Price (per hour/booking)</TableHead>
                            <TableHead>Available Count</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {manpower.map((person) => (
                            <TableRow key={person.id}>
                            <TableCell className="font-medium flex items-center gap-2">
                                {person.name}
                            </TableCell>
                            <TableCell>
                                <Input
                                type="number"
                                value={person.price}
                                onChange={(e) => handleItemUpdate(person.id, 'price', e.target.value)}
                                className="h-9 w-24"
                                />
                            </TableCell>
                            <TableCell>
                                <Input
                                type="number"
                                value={person.stock}
                                onChange={(e) => handleItemUpdate(person.id, 'stock', e.target.value)}
                                className="h-9 w-24"
                                />
                            </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                    </TabsContent>
                </Tabs>
                <div className="flex justify-end mt-6">
                    <Button onClick={handleSaveChanges} disabled={isSaving}>
                        {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <><Save className="mr-2 h-4 w-4" /> Save All Changes</>}
                    </Button>
                </div>
                </>
            )}
            </CardContent>
        </Card>
    );
}

function AllBookings() {
    const firestore = useFirestore();

    const bookingsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, "bookings"), orderBy("createdAt", "desc"));
    }, [firestore]);

    const { data: bookings, isLoading, error } = useCollection<Booking>(bookingsQuery);

    return (
        <Card className="shadow-lg rounded-xl">
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <CalendarDays className="h-6 w-6 text-primary" />
                    All User Bookings
                </CardTitle>
                <CardDescription>A list of all bookings made by users.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading && !bookings ? (
                    <div className="space-y-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                ) : error ? (
                    <div className="text-center py-10 text-destructive flex flex-col items-center gap-2">
                        <AlertCircle />
                        <p>Could not load bookings.</p>
                        <p className="text-sm">{error.message}</p>
                    </div>
                ) : bookings && bookings.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Booking ID</TableHead>
                                <TableHead>User ID</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {bookings.map((booking) => (
                                <TableRow key={booking.id}>
                                    <TableCell className="font-mono text-xs">#{booking.id.substring(0, 7)}</TableCell>
                                    <TableCell className="font-mono text-xs text-muted-foreground">@{booking.uid.substring(0, 8)}</TableCell>
                                    <TableCell className="font-medium">
                                        {booking.createdAt instanceof Timestamp ? format(booking.createdAt.toDate(), 'PPP') : 'Processing...'}
                                    </TableCell>
                                    <TableCell>RS.{booking.totalAmount.toFixed(2)}</TableCell>
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
                    <div className="text-center py-10">
                        <p className="text-muted-foreground">There are no bookings yet.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default function AdminPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
          <h1 className="text-3xl font-bold font-headline">Admin Dashboard</h1>
          <VenueManagement />
          <SlotGenerator />
          <PriceStockManagement />
          <AllBookings />
      </div>
    </div>
  );
}
