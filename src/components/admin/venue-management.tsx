
"use client"

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import type { Venue } from "@/lib/types";
import { Building, Loader2, Save, Image as ImageIcon } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { Separator } from "../ui/separator";

export function VenueManagement() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const venueRef = useMemoFirebase(() => firestore && doc(firestore, 'venue', 'avit-ground'), [firestore]);
    const { data: venue, isLoading: isVenueLoading } = useDoc<Venue>(venueRef);

    const [formData, setFormData] = useState<Partial<Venue>>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (venue) {
            const images = Array.isArray(venue.images) ? venue.images : [];
            while (images.length < 3) {
                images.push('');
            }
            setFormData({...venue, images: images.slice(0, 3)});
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

    const handleImageChange = (index: number, value: string) => {
        setFormData(prev => {
            const newImages = [...(prev.images || [])];
            newImages[index] = value;
            return { ...prev, images: newImages };
        })
    }


    const handleSaveChanges = async () => {
        if (!venueRef) return;
        setIsSaving(true);
        toast({ title: "Saving venue details..." });
        
        try {
            const dataToSave = {
                ...formData,
                rating: parseFloat(String(formData.rating)) || 0,
                basePrice: parseFloat(String(formData.basePrice)) || 0,
                images: (formData.images || []).filter(img => img.trim() !== '')
            };

            await setDoc(venueRef, dataToSave, { merge: true });

            toast({
                title: "Success!",
                description: "Venue details have been updated.",
            });
        } catch (error) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: "Error",
                description: "Could not save venue details.",
            });
        } finally {
            setIsSaving(false);
        }
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
                    Edit the details of the cricket ground. These details will be shown to users across the app. Fill this out first to get started.
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
                        <Label htmlFor="contact.primary">Primary Contact ("Call Venue" Button)</Label>
                        <Input id="contact.primary" name="contact.primary" value={formData.contact?.primary || ''} onChange={handleContactChange} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="contact.secondary">Secondary/Admissions Contact</Label>
                        <Input id="contact.secondary" name="contact.secondary" value={formData.contact?.secondary || ''} onChange={handleContactChange} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="contact.email">Contact Email</Label>
                        <Input id="contact.email" name="contact.email" type="email" value={formData.contact?.email || ''} onChange={handleContactChange} />
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="googleMapsUrl">Google Maps Link</Label>
                    <Input id="googleMapsUrl" name="googleMapsUrl" value={formData.googleMapsUrl || ''} onChange={handleInputChange} placeholder="https://maps.app.goo.gl/..." />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="basePrice">Base Price (per hour)</Label>
                    <Input id="basePrice" name="basePrice" type="number" value={formData.basePrice || ''} onChange={handleInputChange} />
                </div>

                <Separator className="my-6" />

                 <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        <h4 className="font-medium">Venue Images</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">Add up to 3 image URLs. These will be displayed in the venue carousel.</p>
                     <div className="grid grid-cols-1 gap-4">
                         <div className="space-y-2">
                            <Label htmlFor="image1">Image URL 1</Label>
                            <Input id="image1" name="image1" value={formData.images?.[0] || ''} onChange={(e) => handleImageChange(0, e.target.value)} placeholder="https://example.com/image1.jpg"/>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="image2">Image URL 2</Label>
                            <Input id="image2" name="image2" value={formData.images?.[1] || ''} onChange={(e) => handleImageChange(1, e.target.value)} placeholder="https://example.com/image2.jpg"/>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="image3">Image URL 3</Label>
                            <Input id="image3" name="image3" value={formData.images?.[2] || ''} onChange={(e) => handleImageChange(2, e.target.value)} placeholder="https://example.com/image3.jpg"/>
                        </div>
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
                            Save All Changes
                        </>
                    )}
                </Button>
            </CardFooter>
        </Card>
    )
}
