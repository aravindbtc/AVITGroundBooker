
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { User as UserIcon, Loader2, Save, AlertCircle, LogIn } from "lucide-react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import type { UserProfile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

function ProfileForm() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, "users", user.uid);
    }, [firestore, user]);

    const { data: userProfile, isLoading, error } = useDoc<UserProfile>(userProfileRef);

    const [displayName, setDisplayName] = useState('');
    const [collegeId, setCollegeId] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (userProfile) {
            setDisplayName(userProfile.fullName || '');
            setCollegeId(userProfile.collegeId || '');
        } else {
            // Explicitly clear fields if no user profile is loaded
            setDisplayName('');
            setCollegeId('');
        }
    }, [userProfile]);

    const handleSaveChanges = async () => {
        if (!userProfileRef) return;
        setIsSaving(true);
        toast({ title: "Saving profile..." });
        
        try {
            await setDoc(userProfileRef, {
                fullName: displayName,
                collegeId: collegeId,
            }, { merge: true });
            toast({ title: "Success!", description: "Your profile has been updated." });
        } catch (e) {
            console.error(e);
            toast({ variant: "destructive", title: "Error", description: "Could not save your profile." });
        } finally {
            setIsSaving(false);
        }
    }


    if (isUserLoading || (user && isLoading)) {
        return (
            <div className="space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                </div>
                 <Skeleton className="h-10 w-32" />
            </div>
        );
    }
    
    if (!user) {
        return (
            <div className="text-center py-10">
                <p className="text-muted-foreground mb-4">Please log in to manage your profile.</p>
                 <Button asChild>
                    <Link href="/login">
                        <LogIn className="mr-2 h-4 w-4" />
                        Login
                    </Link>
                </Button>
            </div>
        )
    }

    if (error) {
        return (
            <div className="text-center py-10 text-destructive flex flex-col items-center gap-2">
                <AlertCircle />
                <p>Could not load your profile.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" value={user?.email || ''} disabled />
                 <p className="text-xs text-muted-foreground">Your email address cannot be changed.</p>
            </div>
            <div className="space-y-2">
                <Label htmlFor="displayName">Full Name</Label>
                <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="collegeId">College ID</Label>
                <Input id="collegeId" value={collegeId} onChange={(e) => setCollegeId(e.target.value)} />
            </div>
            <Button onClick={handleSaveChanges} disabled={isSaving || !displayName || !collegeId}>
                {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Saving...</> : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
            </Button>
        </div>
    )
}

export default function ProfilePage() {
    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">
            <div className="space-y-1">
                 <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                    <UserIcon className="h-8 w-8 text-primary" />
                    My Profile
                </h1>
                <p className="text-muted-foreground">Manage your personal information and account settings.</p>
            </div>
            <Card>
                <CardContent className="pt-6">
                    <ProfileForm />
                </CardContent>
            </Card>
        </div>
    );
}
