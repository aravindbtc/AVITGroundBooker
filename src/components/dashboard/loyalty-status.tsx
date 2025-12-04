import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { mockUser } from "@/lib/data";
import { Gem, Trophy } from "lucide-react";

const tiers = {
    Bronze: { points: 100, next: 'Silver' },
    Silver: { points: 500, next: 'Gold' },
    Gold: { points: 1000, next: 'Gold' }
};

export function LoyaltyStatus() {
    const { loyalty } = mockUser;
    const currentTierName = loyalty.tier;
    const nextTierName = tiers[currentTierName].next;
    const nextTierPoints = tiers[nextTierName]?.points || tiers[currentTierName].points;
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
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
            <Gem />
            Loyalty Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Trophy className={`h-8 w-8 ${
                    loyalty.tier === 'Gold' ? 'text-yellow-400' :
                    loyalty.tier === 'Silver' ? 'text-slate-400' :
                    'text-orange-400'
                }`} />
                <div>
                    <p className="font-bold text-lg">{loyalty.tier} Tier</p>
                    <p className="text-sm text-muted-foreground">{loyalty.points.toLocaleString()} Points</p>
                </div>
            </div>
            <p className="font-bold text-lg text-primary">≈ ₹{loyalty.points}</p>
        </div>
        <div>
            <Progress value={progress} className="h-2" />
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                {loyalty.tier !== 'Gold' ? (
                     <>
                        <span>{loyalty.tier}</span>
                        <span>{nextTierName}</span>
                     </>
                ): <span className="w-full text-center">You are at the highest tier!</span>}
            </div>
        </div>
        {loyalty.tier !== 'Gold' && (
            <p className="text-center text-sm">
                You're <span className="font-bold text-primary">{pointsToNextTier} points</span> away from {nextTierName} tier!
            </p>
        )}
      </CardContent>
    </Card>
  );
}
