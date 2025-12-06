import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { mockUser } from "@/lib/data";
import { Gem, Trophy } from "lucide-react";

const tiers = {
    Bronze: { points: 100, next: 'Silver', color: 'text-orange-400' },
    Silver: { points: 500, next: 'Gold', color: 'text-slate-400' },
    Gold: { points: 1000, next: 'Gold', color: 'text-amber-400' }
};

export function LoyaltyStatus() {
    const { loyalty } = mockUser;
    const currentTierName = loyalty.tier;
    const currentTierInfo = tiers[currentTierName];
    const nextTierName = currentTierInfo.next;
    const nextTierPoints = tiers[nextTierName]?.points || currentTierInfo.points;
    const prevTierPoints = currentTierName === 'Silver' ? tiers.Bronze.points : 0;
    
    let progress = 0;
    if (currentTierName === 'Gold') {
        progress = 100;
    } else {
        const tierPointsRange = nextTierPoints - prevTierPoints;
        const userPointsInTier = loyalty.points - prevTierPoints;
        progress = (userPointsInTier / tierPointsRange) * 100;
    }

    const pointsToNextTier = nextTierPoints - loyalty.points;

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
                <Trophy className={`h-10 w-10 ${currentTierInfo.color}`} />
                <div>
                    <p className="font-bold text-xl">{loyalty.tier} Tier</p>
                    <p className="text-sm opacity-80">{loyalty.points.toLocaleString()} Points</p>
                </div>
            </div>
            <p className="font-bold text-2xl">₹{loyalty.points}</p>
        </div>
        <div>
            <Progress value={progress} className="h-3 [&>*]:bg-accent" />
            <div className="mt-2 flex justify-between text-xs font-medium text-muted-foreground">
                {loyalty.tier !== 'Gold' ? (
                     <>
                        <span>{prevTierPoints} pts</span>
                        <span>{nextTierPoints} pts</span>
                     </>
                ): <span className="w-full text-center font-semibold">You are at the highest tier!</span>}
            </div>
        </div>
        {loyalty.tier !== 'Gold' && (
            <p className="text-center text-sm font-medium p-2 bg-green-50 rounded-md border border-green-200 text-green-800">
                You're <span className="font-bold">{pointsToNextTier} points</span> away from {nextTierName} tier!
            </p>
        )}
      </CardContent>
    </Card>
  );
}
