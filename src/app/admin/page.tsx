
"use client"
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockAddons, mockManpower } from '@/lib/data';
import type { Addon, Manpower } from '@/lib/types';
import { ShieldAlert, Save, CalendarPlus, Loader2 } from "lucide-react";
import { useFirestore } from '@/firebase';
import { writeBatch, doc, collection, Timestamp } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { addDays, startOfDay } from 'date-fns';
import { VenueManagement } from '@/components/admin/venue-management';


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

                for (let hour = 5; hour < 22; hour++) {
                    const startTime = `${hour.toString().padStart(2, '0')}:00`;
                    const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
                    const isPeak = hour >= 17; // 5 PM onwards is peak

                    const slotId = `${day.toISOString().split('T')[0]}_${hour}`;
                    const slotRef = doc(firestore, 'slots', slotId);

                    batch.set(slotRef, {
                        id: slotId,
                        date: firestoreDate,
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


export default function AdminPage() {
  const [addons, setAddons] = useState<Addon[]>(mockAddons);
  const [manpower, setManpower] = useState<Manpower[]>(mockManpower);

  const handleAddonUpdate = (id: string, field: 'price' | 'stock', value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      setAddons(addons.map(a => a.id === id ? { ...a, [field]: numValue } : a));
    }
  };

  const handleManpowerUpdate = (id: string, field: 'price' | 'stock', value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      setManpower(manpower.map(m => m.id === id ? { ...m, [field]: numValue } : m));
    }
  };

  return (
    <div className="space-y-8">
        <VenueManagement />
        <SlotGenerator />
        <Card className="w-full max-w-4xl mx-auto shadow-lg rounded-xl">
            <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
                <ShieldAlert className="h-6 w-6 text-primary" />
                Price & Stock Management
            </CardTitle>
            </CardHeader>
            <CardContent>
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
                            <addon.icon className="h-5 w-5 text-muted-foreground" />
                            {addon.name}
                        </TableCell>
                        <TableCell>
                            <Input
                            type="number"
                            defaultValue={addon.price}
                            onChange={(e) => handleAddonUpdate(addon.id, 'price', e.target.value)}
                            className="h-9 w-24"
                            />
                        </TableCell>
                        <TableCell>
                            <Input
                            type="number"
                            defaultValue={addon.stock}
                            onChange={(e) => handleAddonUpdate(addon.id, 'stock', e.target.value)}
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
                        <TableHead>Available</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {manpower.map((person) => (
                        <TableRow key={person.id}>
                        <TableCell className="font-medium flex items-center gap-2">
                            <person.icon className="h-5 w-5 text-muted-foreground" />
                            {person.name}
                        </TableCell>
                        <TableCell>
                            <Input
                            type="number"
                            defaultValue={person.price}
                            onChange={(e) => handleManpowerUpdate(person.id, 'price', e.target.value)}
                            className="h-9 w-24"
                            />
                        </TableCell>
                        <TableCell>
                            <Input
                            type="number"
                            defaultValue={person.stock}
                            onChange={(e) => handleManpowerUpdate(person.id, 'stock', e.target.value)}
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
                <Button>
                <Save className="mr-2 h-4 w-4" />
                Save All Changes
                </Button>
            </div>
            </CardContent>
        </Card>
    </div>
  );
}
