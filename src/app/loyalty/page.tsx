
'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Gem, Trophy, User as UserIcon, AlertCircle } from "lucide-react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { UserProfile } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const tiers = {
    Bronze: { points: 0, next: 'Silver', nextPoints: 500, color: 'text-orange-400' },
    Silver: { points: 500, next: 'Gold', nextPoints: 2000, color: 'text-slate-400' },
    Gold: { points: 2000, next: 'Platinum', nextPoints: 5000, color: 'text-amber-400' },
    Platinum: { points: 5000, next: 'Platinum', nextPoints: 5000, color: 'text-violet-400' }
};

function LoyaltyStatus() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, "users", user.uid);
    }, [firestore, user]);

    const { data: userProfile, isLoading, error } = useDoc<UserProfile>(userProfileRef);
    
    if (isUserLoading || isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-8 w-full" />
                 <Skeleton className="h-10 w-full" />
            </div>
        )
    }

    if (!user) {
         return (
            <div className="text-center py-10">
                <p className="text-muted-foreground mb-4">Please log in to see your loyalty status.</p>
                 <Button asChild>
                    <Link href="/login">Login</Link>
                </Button>
            </div>
        )
    }
    
    if (error) {
        return (
            <div className="text-center py-10 text-destructive flex flex-col items-center gap-2">
                <AlertCircle />
                <p>Could not load your loyalty information.</p>
            </div>
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
        <div className="space-y-4">
            <div className={`flex items-center justify-between p-4 rounded-lg bg-gradient-to-tr from-primary/80 to-primary text-primary-foreground`}>
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
        </div>
    );

}

export default function LoyaltyPage() {
  return (
      <div className="w-full max-w-md mx-auto space-y-6">
        <div className="space-y-1">
            <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                <Gem className="h-8 w-8 text-primary" />
                Loyalty Program
            </h1>
            <p className="text-muted-foreground">Earn points for every booking and unlock exclusive rewards.</p>
        </div>
        <Card>
            <CardContent className="pt-6">
                <LoyaltyStatus />
            </CardContent>
        </Card>
      </div>
  );
}
