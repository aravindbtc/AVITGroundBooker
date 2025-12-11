
"use client"
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Booking, UserProfile } from '@/lib/types';
import { ShieldAlert, Save, Loader2, AlertCircle, CalendarDays, Users, Trash2, PlusCircle } from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { writeBatch, doc, collection, Timestamp, query, orderBy, updateDoc, addDoc } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { VenueManagement } from '@/components/admin/venue-management';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


// Represents both Accessory and Manpower types from schema
type ItemForManagement = {
    id: string;
    name: string;
    price: number;
    stock: number;
    type: 'item' | 'manpower';
};

function PriceStockManagement() {
    const firestore = useFirestore();
    const { toast } = useToast();

    const accessoriesQuery = useMemoFirebase(() => firestore && query(collection(firestore, 'accessories')), [firestore]);
    const { data, isLoading: dataLoading, error } = useCollection<ItemForManagement>(accessoriesQuery);
    
    const [items, setItems] = useState<ItemForManagement[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    
    // State for Add New Item dialog
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [newItemPrice, setNewItemPrice] = useState(0);
    const [newItemStock, setNewItemStock] = useState(0);
    const [newItemType, setNewItemType] = useState<'item' | 'manpower'>('item');
    const [isAdding, setIsAdding] = useState(false);


    useEffect(() => {
        if (data) {
            setItems(data);
        }
    }, [data]);

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

    const handleAddNewItem = async () => {
        if (!firestore) return;
        if (!newItemName || newItemPrice < 0 || newItemStock < 0) {
            toast({ variant: 'destructive', title: "Invalid Input", description: "Please provide a valid name, price, and stock."});
            return;
        }

        setIsAdding(true);
        toast({ title: "Adding new item..." });

        try {
            const accessoriesCollection = collection(firestore, 'accessories');
            await addDoc(accessoriesCollection, {
                name: newItemName,
                price: newItemPrice,
                stock: newItemStock,
                type: newItemType,
            });

            toast({ title: "Success!", description: `${newItemName} has been added.`});
            // Reset form and close dialog
            setNewItemName('');
            setNewItemPrice(0);
            setNewItemStock(0);
            setIsAddDialogOpen(false);
        } catch (error) {
             console.error("Error adding new item:", error);
            toast({ variant: 'destructive', title: "Error", description: "Could not add the new item." });
        } finally {
            setIsAdding(false);
        }
    }
    
    const accessories = items.filter(item => item.type === 'item');
    const manpower = items.filter(item => item.type === 'manpower');
    const isLoading = dataLoading;

    return (
         <Card className="w-full max-w-4xl mx-auto shadow-lg rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 font-headline">
                        <ShieldAlert className="h-6 w-6 text-primary" />
                        Price & Stock Management
                    </CardTitle>
                    <CardDescription>Edit prices and available stock for accessories and manpower.</CardDescription>
                </div>
                 <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add New Item
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                        <DialogTitle>Add New Item</DialogTitle>
                        <DialogDescription>
                            Add a new accessory or manpower service to the booking system.
                        </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">
                                Name
                                </Label>
                                <Input id="name" value={newItemName} onChange={e => setNewItemName(e.target.value)} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="price" className="text-right">
                                Price (RS.)
                                </Label>
                                <Input id="price" type="number" value={newItemPrice} onChange={e => setNewItemPrice(Number(e.target.value))} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="stock" className="text-right">
                                Stock
                                </Label>
                                <Input id="stock" type="number" value={newItemStock} onChange={e => setNewItemStock(Number(e.target.value))} className="col-span-3" />
                            </div>
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="type" className="text-right">
                                Type
                                </Label>
                                 <Select onValueChange={(value: 'item' | 'manpower') => setNewItemType(value)} defaultValue={newItemType}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select a type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="item">Accessory</SelectItem>
                                        <SelectItem value="manpower">Manpower</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary">
                                Cancel
                                </Button>
                            </DialogClose>
                            <Button type="button" onClick={handleAddNewItem} disabled={isAdding}>
                                {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Item
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                </div>
             ) : error ? (
                 <div className="text-center py-10 text-destructive flex flex-col items-center gap-2">
                    <AlertCircle />
                    <p>Could not load items.</p>
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
    const { toast } = useToast();

    const bookingsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, "bookings"), orderBy("createdAt", "desc"));
    }, [firestore]);

    const { data: bookings, isLoading, error } = useCollection<Booking>(bookingsQuery);

    const handleCancelBooking = async (bookingId: string) => {
        if (!firestore) return;
        const bookingRef = doc(firestore, 'bookings', bookingId);
        try {
            await updateDoc(bookingRef, { status: 'cancelled' });
            toast({
                title: "Booking Cancelled",
                description: `Booking #${bookingId.substring(0,7)} has been marked as cancelled.`
            })
        } catch (e) {
            console.error(e);
             toast({
                variant: 'destructive',
                title: "Error",
                description: "Could not cancel booking."
            })
        }
    }

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
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {bookings.map((booking) => (
                                <TableRow key={booking.id}>
                                    <TableCell className="font-mono text-xs">#{booking.id?.substring(0, 7)}</TableCell>
                                    <TableCell className="font-mono text-xs text-muted-foreground">@{booking.uid.substring(0, 8)}</TableCell>
                                    <TableCell className="font-medium">
                                        {booking.createdAt instanceof Timestamp ? format(booking.createdAt.toDate(), 'PPP') : 'Processing...'}
                                    </TableCell>
                                    <TableCell>RS.{booking.totalAmount.toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Badge variant={booking.status === 'paid' ? 'default' : booking.status === 'cancelled' ? 'destructive' : 'secondary'}>
                                            {booking.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" disabled={booking.status === 'cancelled' || booking.status === 'failed'}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will cancel the user's booking. This action cannot be undone.
                                                </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel>Back</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleCancelBooking(booking.id!)}>Confirm Cancellation</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
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

function UserManagement() {
    const firestore = useFirestore();

    const usersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, "users"), orderBy("createdAt", "desc"));
    }, [firestore]);

    const { data: users, isLoading, error } = useCollection<UserProfile>(usersQuery);

    return (
        <Card className="shadow-lg rounded-xl">
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <Users className="h-6 w-6 text-primary" />
                    User Management
                </CardTitle>
                <CardDescription>View and manage all registered users.</CardDescription>
            </CardHeader>
            <CardContent>
                 {isLoading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                ) : error ? (
                    <div className="text-center py-10 text-destructive flex flex-col items-center gap-2">
                        <AlertCircle />
                        <p>Could not load users.</p>
                        <p className="text-sm">{error.message}</p>
                    </div>
                ) : users && users.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Full Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>College ID</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead className="text-right">Loyalty Points</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.fullName}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{user.collegeId || 'N/A'}</TableCell>
                                    <TableCell>
                                        <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>{user.role}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">{user.loyaltyPoints}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="text-center py-10">
                        <p className="text-muted-foreground">There are no users yet.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export default function AdminPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
          <h1 className="text-3xl font-bold font-headline">Admin Dashboard</h1>
          <VenueManagement />
          <PriceStockManagement />
          <AllBookings />
          <UserManagement />
      </div>
    </div>
  );
}
