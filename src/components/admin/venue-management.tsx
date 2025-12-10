
"use client"

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useDoc, useFirestore, useMemoFirebase, setDocumentNonBlocking } from "@/firebase";
import { doc } from "firebase/firestore";
import type { Venue } from "@/lib/types";
import { Building, Loader2, Save } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

export function VenueManagement() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const venueRef = useMemoFirebase(() => firestore && doc(firestore, 'venue', 'avit-ground'), [firestore]);
    const { data: venue, isLoading: isVenueLoading } = useDoc<Venue>(venueRef);

    const [formData, setFormData] = useState<Partial<Venue>>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (venue) {
            setFormData(venue);
        }
    }, [venue]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const field = name.split('.')[1];
        setFormData(prev => ({
            ...prev,
            contact: {
                ...prev.contact,
                [field]: value,
            } as Venue['contact']
        }));
    }

    const handleGpsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const field = name.split('.')[1]
        setFormData(prev => ({
            ...prev,
            gps: {
                ...prev.gps,
                [field]: parseFloat(value) || 0,
            } as Venue['gps']
        }));
    }

    const handleSaveChanges = () => {
        if (!venueRef) return;
        setIsSaving(true);
        toast({ title: "Saving venue details..." });
        
        const dataToSave = {
            ...formData,
            rating: parseFloat(String(formData.rating)) || 0,
            basePrice: parseFloat(String(formData.basePrice)) || 0,
        };

        setDocumentNonBlocking(venueRef, dataToSave, { merge: true });

        // A slight delay to allow the user to see the toast, as the non-blocking update is very fast.
        setTimeout(() => {
            toast({
                title: "Success!",
                description: "Venue details have been updated.",
            });
            setIsSaving(false);
        }, 1000);
    };

    if (isVenueLoading) {
        return (
             <Card className="w-full max-w-4xl mx-auto shadow-lg rounded-xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-headline">
                        <Building className="h-6 w-6 text-primary" />
                        Venue Management
                    </CardTitle>
                    <CardDescription>
                        Edit the details of the cricket ground.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </CardContent>
                 <CardFooter>
                    <Skeleton className="h-10 w-32" />
                </CardFooter>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-4xl mx-auto shadow-lg rounded-xl">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline">
                    <Building className="h-6 w-6 text-primary" />
                    Venue Management
                </CardTitle>
                <CardDescription>
                    Edit the details of the cricket ground. These details will be shown to users across the app.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="fullName">Venue Name</Label>
                    <Input id="fullName" name="fullName" value={formData.fullName || ''} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" name="address" value={formData.address || ''} onChange={handleInputChange} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="space-y-2">
                        <Label htmlFor="contact.general">Contact Phone (General)</Label>
                        <Input id="contact.general" name="contact.general" value={formData.contact?.general || ''} onChange={handleContactChange} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="contact.admissions">Contact Phone (Admissions)</Label>
                        <Input id="contact.admissions" name="contact.admissions" value={formData.contact?.admissions || ''} onChange={handleContactChange} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="contact.email">Contact Email</Label>
                        <Input id="contact.email" name="contact.email" type="email" value={formData.contact?.email || ''} onChange={handleContactChange} />
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label htmlFor="gps.lat">GPS Latitude</Label>
                        <Input id="gps.lat" name="gps.lat" type="number" value={formData.gps?.lat || ''} onChange={handleGpsChange} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="gps.lng">GPS Longitude</Label>
                        <Input id="gps.lng" name="gps.lng" type="number" value={formData.gps?.lng || ''} onChange={handleGpsChange} />
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label htmlFor="basePrice">Base Price (per hour)</Label>
                        <Input id="basePrice" name="basePrice" type="number" value={formData.basePrice || ''} onChange={handleInputChange} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="rating">Rating (1-5)</Label>
                        <Input id="rating" name="rating" type="number" step="0.1" max="5" min="0" value={formData.rating || ''} onChange={handleInputChange} />
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                 <Button onClick={handleSaveChanges} disabled={isSaving}>
                    {isSaving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                        </>
                    )}
                </Button>
            </CardFooter>
        </Card>
    )
}
