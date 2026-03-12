import { AppLayout } from "@/components/layout/AppLayout";
import { Card, Badge, Skeleton } from "@/components/ui/design-system";
import { useGetMyRewards } from "@workspace/api-client-react";
import { Crown, Gift, Target, ArrowUpRight } from "lucide-react";

export default function Rewards() {
  const { data, isLoading } = useGetMyRewards();

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <Card className="flex-1 bg-gradient-to-br from-primary/20 to-black/40 border-primary/30 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-primary/20 blur-3xl rounded-full" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <Crown className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-primary">Sovereign Points</h3>
              </div>
              <p className="text-5xl font-display font-bold text-white mb-2">
                {isLoading ? <Skeleton className="h-12 w-32" /> : data?.totalPoints || 0}
              </p>
              <p className="text-sm text-muted-foreground">Available to redeem on digital assets.</p>
            </div>
          </Card>
          
          <Card className="flex-1 flex flex-col justify-center items-center text-center">
            <Target className="w-8 h-8 text-white/50 mb-3" />
            <p className="text-sm text-muted-foreground mb-1">Current Tier</p>
            <h3 className="text-2xl font-bold text-white mb-3 capitalize">
              {isLoading ? <Skeleton className="h-8 w-24 mx-auto" /> : data?.tier || 'Initiate'}
            </h3>
            <div className="w-full bg-white/10 rounded-full h-1.5 mb-2">
              <div className="bg-primary h-1.5 rounded-full" style={{ width: '45%' }}></div>
            </div>
            <p className="text-xs text-muted-foreground">1,450 points to Elite</p>
          </Card>
        </div>

        <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
          <Gift className="w-6 h-6" /> Reward History
        </h2>
        
        <Card className="p-0 overflow-hidden border-white/5">
          {isLoading ? (
             <div className="p-6 space-y-4">
               {[1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)}
             </div>
          ) : data?.history?.length ? (
            <div className="divide-y divide-white/5">
              {data.history.map((entry) => (
                <div key={entry.id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <ArrowUpRight className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{entry.description}</p>
                      <p className="text-sm text-muted-foreground capitalize">{entry.type} • {new Date(entry.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Badge variant="success" className="text-sm px-3 py-1">+{entry.points} PTS</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground">
              <p>No reward history found.</p>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
