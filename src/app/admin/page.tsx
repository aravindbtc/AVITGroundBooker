
"use client"
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Addon, Manpower } from '@/lib/types';
import { ShieldAlert, Save, CalendarPlus, Loader2 } from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { writeBatch, doc, collection, Timestamp } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { addDays, format, startOfDay } from 'date-fns';
import { VenueManagement } from '@/components/admin/venue-management';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';


function SlotGenerator() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const generateSlots = async () => {
        if (!firestore) return;
        setIsLoading(true);
        toast({
            title: "Generating Slots...",
            description: "Please wait while we create slots for the next 30 days.",
        });

        try {
            const batch = writeBatch(firestore);
            const today = startOfDay(new Date());

            for (let i = 0; i < 30; i++) {
                const day = addDays(today, i);
                const firestoreDate = Timestamp.fromDate(day);
                const dateString = format(day, 'yyyy-MM-dd');

                for (let hour = 5; hour < 22; hour++) {
                    const startTime = `${hour.toString().padStart(2, '0')}:00`;
                    const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
                    const isPeak = hour >= 17; // 5 PM onwards is peak

                    const slotId = `${dateString}_${hour}`;
                    const slotRef = doc(firestore, 'slots', slotId);

                    batch.set(slotRef, {
                        id: slotId,
                        date: firestoreDate,
                        dateString: dateString,
                        startTime,
                        endTime,
                        isPeak,
                        status: 'available',
                    });
                }
            }

            await batch.commit();
            toast({
                title: "Success!",
                description: "Time slots for the next 30 days have been generated.",
            });
        } catch (error) {
            console.error("Error generating slots:", error);
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: "Could not generate time slots. Please try again.",
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
                    Populate the database with available time slots for booking. This will generate hourly slots from 5 AM to 10 PM for the next 30 days.
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
    const { data: accessoriesData, isLoading: accessoriesLoading } = useCollection<Addon>(accessoriesQuery);
    
    const manpowerQuery = useMemoFirebase(() => firestore && collection(firestore, 'manpower'), [firestore]);
    const { data: manpowerData, isLoading: manpowerLoading } = useCollection<Manpower>(manpowerQuery);

    const [addons, setAddons] = useState<Addon[]>([]);
    const [manpower, setManpower] = useState<Manpower[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (accessoriesData) setAddons(accessoriesData);
    }, [accessoriesData]);

    useEffect(() => {
        if (manpowerData) setManpower(manpowerData);
    }, [manpowerData]);

    const handleAddonUpdate = (id: string, field: 'price' | 'quantity', value: string) => {
        const numValue = parseInt(value, 10);
        if (isNaN(numValue) || numValue < 0) return;
        setAddons(current => current.map(a => a.id === id ? { ...a, [field]: numValue } : a));
    };

    const handleManpowerPriceUpdate = (id: string, value: string) => {
        const numValue = parseInt(value, 10);
        if (isNaN(numValue) || numValue < 0) return;
        setManpower(current => current.map(m => m.id === id ? { ...m, price: numValue } : m));
    };

    const handleManpowerAvailabilityUpdate = (id: string, checked: boolean) => {
        setManpower(current => current.map(m => m.id === id ? { ...m, availability: checked } : m));
    };
    
    const handleSaveChanges = async () => {
        if (!firestore) return;
        setIsSaving(true);
        toast({ title: "Saving changes..." });

        try {
            const batch = writeBatch(firestore);

            addons.forEach(addon => {
                const docRef = doc(firestore, 'accessories', addon.id);
                batch.update(docRef, { price: addon.price, quantity: addon.quantity });
            });

            manpower.forEach(person => {
                const docRef = doc(firestore, 'manpower', person.id);
                batch.update(docRef, { price: person.price, availability: person.availability });
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

    const isLoading = accessoriesLoading || manpowerLoading;

    return (
         <Card className="w-full max-w-4xl mx-auto shadow-lg rounded-xl">
            <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
                <ShieldAlert className="h-6 w-6 text-primary" />
                Price & Stock Management
            </CardTitle>
            </CardHeader>
            <CardContent>
            {isLoading ? (
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
                        {addons.map((addon) => (
                            <TableRow key={addon.id}>
                            <TableCell className="font-medium flex items-center gap-2">
                                {addon.name}
                            </TableCell>
                            <TableCell>
                                <Input
                                type="number"
                                value={addon.price}
                                onChange={(e) => handleAddonUpdate(addon.id, 'price', e.target.value)}
                                className="h-9 w-24"
                                />
                            </TableCell>
                            <TableCell>
                                <Input
                                type="number"
                                value={addon.quantity}
                                onChange={(e) => handleAddonUpdate(addon.id, 'quantity', e.target.value)}
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
                            <TableHead>Price (RS.)</TableHead>
                            <TableHead>Availability</TableHead>
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
                                onChange={(e) => handleManpowerPriceUpdate(person.id, e.target.value)}
                                className="h-9 w-24"
                                />
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id={`availability-${person.id}`}
                                        checked={person.availability}
                                        onCheckedChange={(checked) => handleManpowerAvailabilityUpdate(person.id, checked)}
                                    />
                                    <Label htmlFor={`availability-${person.id}`} className={person.availability ? "text-green-600" : "text-red-600"}>
                                        {person.availability ? "Available" : "Unavailable"}
                                    </Label>
                                </div>
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


export default function AdminPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
          <h1 className="text-3xl font-bold font-headline">Admin Dashboard</h1>
          <VenueManagement />
          <SlotGenerator />
          <PriceStockManagement />
      </div>
    </div>
  );
}
