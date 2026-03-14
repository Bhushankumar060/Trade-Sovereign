import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import AppLayout from '../components/layout/AppLayout';
import { Card, Button, Badge, Spinner } from '../components/ui/DesignSystem';
import { useAuth } from '../contexts/AuthContext';
import { getMyRewards } from '../lib/api';
import { formatDate } from '../lib/utils';
import { Gift, Trophy, Star, Crown, Lock, TrendingUp, Coins } from 'lucide-react';

const TIERS = [
  { name: 'Bronze', points: 0, color: 'from-amber-700 to-amber-900', icon: Star },
  { name: 'Silver', points: 500, color: 'from-slate-400 to-slate-600', icon: Star },
  { name: 'Gold', points: 1000, color: 'from-yellow-400 to-amber-500', icon: Crown },
  { name: 'Platinum', points: 5000, color: 'from-slate-300 to-slate-400', icon: Trophy },
  { name: 'Diamond', points: 10000, color: 'from-cyan-300 to-blue-400', icon: Trophy },
];

export default function Rewards() {
  const { user, loading: authLoading } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['my-rewards'],
    queryFn: getMyRewards,
    enabled: !!user,
  });

  if (authLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Spinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center text-center">
          <Lock className="w-16 h-16 text-cyan-400 mb-6 opacity-60" />
          <h1 className="text-3xl font-display font-bold mb-4">Sign In Required</h1>
          <p className="text-gray-400 mb-8 max-w-md">Access the Rewards Center to view and earn Sovereign Points.</p>
          <Link to="/login"><Button>Sign In</Button></Link>
        </div>
      </AppLayout>
    );
  }

  const totalPoints = data?.totalPoints || 0;
  const currentTier = data?.tier || 'Bronze';
  const history = data?.history || [];

  const currentTierIndex = TIERS.findIndex(t => t.name === currentTier);
  const nextTier = TIERS[currentTierIndex + 1];
  const progress = nextTier ? ((totalPoints - TIERS[currentTierIndex].points) / (nextTier.points - TIERS[currentTierIndex].points)) * 100 : 100;

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8" data-testid="rewards">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 px-4 py-1">
            <Gift className="w-3 h-3 mr-2" />
            Loyalty Program
          </Badge>
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">Rewards Center</h1>
          <p className="text-gray-400">Earn points on every purchase and climb the ranks</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Points Card */}
          <Card className="lg:col-span-2 relative overflow-hidden" hover3d>
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                  <p className="text-gray-400 text-sm uppercase tracking-wider mb-1">Your Balance</p>
                  <div className="flex items-baseline gap-3">
                    <Coins className="w-10 h-10 text-cyan-400" />
                    <span className="text-5xl font-display font-bold text-gradient-primary">{totalPoints.toLocaleString()}</span>
                    <span className="text-xl text-gray-400">PTS</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${TIERS[currentTierIndex].color} flex items-center justify-center shadow-lg`}>
                    {React.createElement(TIERS[currentTierIndex].icon, { className: 'w-8 h-8 text-white' })}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase">Current Tier</p>
                    <p className="text-2xl font-display font-bold text-white">{currentTier}</p>
                  </div>
                </div>
              </div>

              {nextTier && (
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Progress to {nextTier.name}</span>
                    <span className="text-cyan-400">{nextTier.points - totalPoints} pts to go</span>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(progress, 100)}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Tier Info */}
          <Card className="flex flex-col">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Tier Benefits
            </h3>
            <div className="space-y-3 flex-1">
              {TIERS.map((tier, idx) => (
                <div
                  key={tier.name}
                  className={`flex items-center gap-3 p-2 rounded-lg ${
                    tier.name === currentTier ? 'bg-cyan-400/10 border border-cyan-400/20' : ''
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${tier.color} flex items-center justify-center`}>
                    <tier.icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${tier.name === currentTier ? 'text-cyan-400' : 'text-gray-300'}`}>
                      {tier.name}
                    </p>
                    <p className="text-xs text-gray-500">{tier.points.toLocaleString()}+ pts</p>
                  </div>
                  {tier.name === currentTier && (
                    <Badge variant="success" className="text-xs">Current</Badge>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* History */}
        <Card className="mt-6">
          <h3 className="font-semibold mb-4">Points History</h3>
          {history.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Gift className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No rewards history yet</p>
              <p className="text-sm mt-1">Make a purchase to start earning points!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.slice(0, 10).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm text-white">{item.description}</p>
                      <p className="text-xs text-gray-500">{item.createdAt && formatDate(item.createdAt)}</p>
                    </div>
                  </div>
                  <span className="text-emerald-400 font-semibold">+{item.points}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
