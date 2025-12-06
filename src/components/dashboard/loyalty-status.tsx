
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Gem, Trophy, AlertCircle } from "lucide-react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { UserProfile } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Button } from "../ui/button";

const tiers = {
    Bronze: { points: 0, next: 'Silver', nextPoints: 500, color: 'text-orange-400' },
    Silver: { points: 500, next: 'Gold', nextPoints: 2000, color: 'text-slate-400' },
    Gold: { points: 2000, next: 'Platinum', nextPoints: 5000, color: 'text-amber-400' },
    Platinum: { points: 5000, next: 'Platinum', nextPoints: 5000, color: 'text-violet-400' }
};

export function LoyaltyStatus() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, "users", user.uid);
    }, [firestore, user]);

    const { data: userProfile, isLoading, error } = useDoc<UserProfile>(userProfileRef);
    
    if (isUserLoading || (isLoading && !userProfile)) {
        return (
             <Card className="shadow-lg rounded-xl">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-3">
                        <Gem className="h-6 w-6 text-accent"/>
                        Loyalty Status
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-8 w-full" />
                </CardContent>
            </Card>
        )
    }

    if (!user) {
         return (
            <Card className="shadow-lg rounded-xl">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-3">
                        <Gem className="h-6 w-6 text-accent"/>
                        Loyalty Status
                    </CardTitle>
                </CardHeader>
                 <CardContent className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Log in to see your points.</p>
                     <Button asChild size="sm">
                        <Link href="/login">Login</Link>
                    </Button>
                </CardContent>
            </Card>
        )
    }
    
    if (error) {
        return (
             <Card className="shadow-lg rounded-xl">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-3">
                        <Gem className="h-6 w-6 text-accent"/>
                        Loyalty Status
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center py-10 text-destructive flex flex-col items-center gap-2">
                    <AlertCircle />
                    <p className="text-sm">Could not load loyalty info.</p>
                </CardContent>
            </Card>
        );
    }
    
    const loyaltyPoints = userProfile?.loyaltyPoints ?? 0;
    const currentTierName = loyaltyPoints >= 5000 ? 'Platinum' : loyaltyPoints >= 2000 ? 'Gold' : loyaltyPoints >= 500 ? 'Silver' : 'Bronze';
    const currentTier = tiers[currentTierName];
    const nextTier = tiers[currentTier.next];

    const pointsInTier = loyaltyPoints - currentTier.points;
    const pointsForNextTier = currentTier.nextPoints - currentTier.points;
    const progress = currentTierName === 'Platinum' ? 100 : (pointsInTier / pointsForNextTier) * 100;
    const pointsToNext = nextTier.points - loyaltyPoints;


  return (
    <Card className="shadow-lg rounded-xl">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-3">
            <Gem className="h-6 w-6 text-accent"/>
            Loyalty Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-tr from-primary/80 to-primary text-primary-foreground">
            <div className="flex items-center gap-3">
                <Trophy className={`h-10 w-10 ${currentTier.color}`} />
                <div>
                    <p className="font-bold text-xl">{currentTierName} Tier</p>
                    <p className="text-sm opacity-80">{loyaltyPoints.toLocaleString()} Points</p>
                </div>
            </div>
        </div>
        <div>
            <Progress value={progress} className="h-3 [&>*]:bg-accent" />
            <div className="mt-2 flex justify-between text-xs font-medium text-muted-foreground">
                {currentTierName !== 'Platinum' ? (
                     <>
                        <span>{currentTier.points} pts</span>
                        <span>{currentTier.nextPoints} pts</span>
                     </>
                ): <span className="w-full text-center font-semibold">You are at the highest tier!</span>}
            </div>
        </div>
        {currentTierName !== 'Platinum' && (
            <p className="text-center text-sm font-medium p-2 bg-green-50 rounded-md border border-green-200 text-green-800 dark:bg-green-950 dark:text-green-200 dark:border-green-800">
                You're <span className="font-bold">{pointsToNext.toLocaleString()} points</span> away from {currentTier.next} tier!
            </p>
        )}
      </CardContent>
    </Card>
  );
}
