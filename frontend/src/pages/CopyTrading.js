import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '../components/layout/AppLayout';
import { Card, Button, Input, Label, Badge, Spinner } from '../components/ui/DesignSystem';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../lib/utils';
import {
  listTraders, getTraderProfile, listTradeSignals, becomeTrader, createTradeSignal,
  copyTrader, stopCopyingTrader, getMyCopies, getMyTraderProfile
} from '../lib/api';
import {
  Users, TrendingUp, TrendingDown, Copy, UserPlus, Target, Shield, Award,
  ChevronRight, Lock, BarChart2, AlertTriangle, Plus, X, Check, Zap
} from 'lucide-react';

export default function CopyTrading() {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('traders');
  const [selectedTrader, setSelectedTrader] = useState(null);
  const [showSignalForm, setShowSignalForm] = useState(false);
  const [copyAmount, setCopyAmount] = useState('1000');

  const { data: tradersData, isLoading: tradersLoading } = useQuery({
    queryKey: ['traders'],
    queryFn: () => listTraders({ sortBy: 'copiers' }),
  });

  const { data: signalsData } = useQuery({
    queryKey: ['signals'],
    queryFn: () => listTradeSignals({}),
  });

  const { data: myCopies } = useQuery({
    queryKey: ['my-copies'],
    queryFn: getMyCopies,
    enabled: !!user,
  });

  const { data: myTraderProfile } = useQuery({
    queryKey: ['my-trader-profile'],
    queryFn: getMyTraderProfile,
    enabled: !!user,
  });

  const becomeTraderMutation = useMutation({
    mutationFn: becomeTrader,
    onSuccess: () => {
      queryClient.invalidateQueries(['my-trader-profile']);
      alert('Congratulations! You are now a trader.');
    },
    onError: (err) => alert(err.response?.data?.detail || 'Failed to become trader'),
  });

  const copyMutation = useMutation({
    mutationFn: ({ traderId, allocation }) => copyTrader(traderId, { allocation }),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-copies']);
      queryClient.invalidateQueries(['traders']);
      setSelectedTrader(null);
      alert('Now copying trader!');
    },
    onError: (err) => alert(err.response?.data?.detail || 'Failed to copy trader'),
  });

  const stopCopyMutation = useMutation({
    mutationFn: stopCopyingTrader,
    onSuccess: () => {
      queryClient.invalidateQueries(['my-copies']);
      queryClient.invalidateQueries(['traders']);
    },
  });

  const createSignalMutation = useMutation({
    mutationFn: createTradeSignal,
    onSuccess: () => {
      queryClient.invalidateQueries(['signals']);
      setShowSignalForm(false);
      alert('Signal created!');
    },
    onError: (err) => alert(err.response?.data?.detail || 'Failed to create signal'),
  });

  const traders = tradersData?.traders || [];
  const signals = signalsData?.signals || [];
  const copies = myCopies?.copies || [];
  const isTrader = myTraderProfile?.isTrader;

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
          <Lock className="w-20 h-20 text-cyan-400 mb-6 opacity-60" />
          <h1 className="text-3xl font-display font-bold mb-4">Sign In Required</h1>
          <p className="text-gray-400 mb-8 max-w-md">Access Copy Trading to follow successful traders and mirror their strategies.</p>
          <Link to="/login"><Button>Sign In</Button></Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8" data-testid="copy-trading">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <Badge className="mb-3 px-3 py-1">
              <Copy className="w-3 h-3 mr-2" />
              Social Trading
            </Badge>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
              Copy <span className="text-gradient-primary">Trading</span>
            </h1>
            <p className="text-gray-400">Mirror successful traders and grow together</p>
          </div>

          <div className="flex gap-3">
            {!isTrader ? (
              <Button
                onClick={() => becomeTraderMutation.mutate()}
                isLoading={becomeTraderMutation.isPending}
                data-testid="become-trader-btn"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Become a Trader
              </Button>
            ) : (
              <Button
                onClick={() => setShowSignalForm(true)}
                data-testid="create-signal-btn"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Signal
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Active Traders', value: traders.length, icon: Users, color: 'from-cyan-400 to-blue-500' },
            { label: 'Total Signals', value: signals.length, icon: Target, color: 'from-purple-400 to-pink-500' },
            { label: 'Your Copies', value: copies.length, icon: Copy, color: 'from-emerald-400 to-teal-500' },
            { label: 'Your Status', value: isTrader ? 'Trader' : 'Copier', icon: Award, color: 'from-amber-400 to-orange-500' },
          ].map((stat, idx) => (
            <Card key={idx} hover3d>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                <stat.icon className="w-5 h-5 text-black" />
              </div>
              <p className="text-gray-400 text-sm">{stat.label}</p>
              <p className="text-xl font-display font-bold text-white">{stat.value}</p>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'traders', label: 'Top Traders', icon: Users },
            { id: 'signals', label: 'Latest Signals', icon: Target },
            { id: 'copies', label: 'My Copies', icon: Copy },
            ...(isTrader ? [{ id: 'my-signals', label: 'My Signals', icon: BarChart2 }] : []),
          ].map(tab => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'primary' : 'glass'}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'traders' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tradersLoading ? (
              <div className="col-span-full flex justify-center py-20">
                <Spinner size="lg" />
              </div>
            ) : traders.length === 0 ? (
              <Card className="col-span-full text-center py-16">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <h3 className="text-xl font-semibold mb-2">No Traders Yet</h3>
                <p className="text-gray-400 mb-6">Be the first to become a trader!</p>
                {!isTrader && (
                  <Button onClick={() => becomeTraderMutation.mutate()}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Become a Trader
                  </Button>
                )}
              </Card>
            ) : (
              traders.map((trader, idx) => (
                <motion.div
                  key={trader.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card hover3d className="h-full" data-testid={`trader-card-${trader.id}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-500/20 flex items-center justify-center border border-white/10">
                          <Users className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white flex items-center gap-2">
                            {trader.displayName || 'Trader'}
                            {trader.isVerified && (
                              <Shield className="w-4 h-4 text-cyan-400" />
                            )}
                          </h3>
                          <p className="text-xs text-gray-400">{trader.copiers || 0} copiers</p>
                        </div>
                      </div>
                      <Badge variant={trader.totalReturn >= 0 ? 'success' : 'destructive'}>
                        {trader.totalReturn >= 0 ? '+' : ''}{trader.totalReturn?.toFixed(1) || 0}%
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="p-3 rounded-xl bg-white/5">
                        <p className="text-xs text-gray-400 mb-1">Win Rate</p>
                        <p className="text-lg font-bold text-white">{trader.winRate?.toFixed(0) || 0}%</p>
                      </div>
                      <div className="p-3 rounded-xl bg-white/5">
                        <p className="text-xs text-gray-400 mb-1">Total Return</p>
                        <p className={`text-lg font-bold ${trader.totalReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {trader.totalReturn >= 0 ? '+' : ''}{trader.totalReturn?.toFixed(1) || 0}%
                        </p>
                      </div>
                    </div>

                    {trader.bio && (
                      <p className="text-sm text-gray-400 mb-4 line-clamp-2">{trader.bio}</p>
                    )}

                    <Button
                      className="w-full"
                      onClick={() => setSelectedTrader(trader)}
                      disabled={copies.some(c => c.traderId === trader.id)}
                    >
                      {copies.some(c => c.traderId === trader.id) ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copying
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Trader
                        </>
                      )}
                    </Button>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        )}

        {activeTab === 'signals' && (
          <div className="space-y-4">
            {signals.length === 0 ? (
              <Card className="text-center py-16">
                <Target className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <h3 className="text-xl font-semibold mb-2">No Signals Yet</h3>
                <p className="text-gray-400">Trading signals will appear here</p>
              </Card>
            ) : (
              signals.map((signal, idx) => (
                <motion.div
                  key={signal.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        signal.action === 'buy' 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {signal.action === 'buy' ? (
                          <TrendingUp className="w-6 h-6" />
                        ) : (
                          <TrendingDown className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-lg">{signal.symbol}</span>
                          <Badge variant={signal.action === 'buy' ? 'success' : 'destructive'}>
                            {signal.action.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-400">
                          Entry: {formatCurrency(signal.entryPrice)}
                          {signal.targetPrice && ` → Target: ${formatCurrency(signal.targetPrice)}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-400">Confidence</p>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-cyan-400 rounded-full"
                              style={{ width: `${signal.confidence}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-cyan-400">{signal.confidence}%</span>
                        </div>
                      </div>
                      {signal.stopLoss && (
                        <Badge variant="warning" className="text-xs">
                          SL: {formatCurrency(signal.stopLoss)}
                        </Badge>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        )}

        {activeTab === 'copies' && (
          <div className="space-y-4">
            {copies.length === 0 ? (
              <Card className="text-center py-16">
                <Copy className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <h3 className="text-xl font-semibold mb-2">Not Copying Anyone</h3>
                <p className="text-gray-400 mb-6">Start copying traders to see them here</p>
                <Button onClick={() => setActiveTab('traders')}>
                  Browse Traders
                </Button>
              </Card>
            ) : (
              copies.map((copy, idx) => (
                <motion.div
                  key={copy.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-500/20 flex items-center justify-center">
                        <Users className="w-6 h-6 text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{copy.traderName}</h3>
                        <p className="text-sm text-gray-400">
                          Allocation: {formatCurrency(copy.allocation)} • {copy.totalCopiedTrades} trades copied
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-gray-400">P/L</p>
                        <p className={`font-bold ${copy.profitLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {copy.profitLoss >= 0 ? '+' : ''}{formatCurrency(copy.profitLoss)}
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => stopCopyMutation.mutate(copy.traderId)}
                        isLoading={stopCopyMutation.isPending}
                      >
                        Stop Copying
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        )}

        {activeTab === 'my-signals' && isTrader && (
          <div>
            <div className="flex justify-end mb-4">
              <Button onClick={() => setShowSignalForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Signal
              </Button>
            </div>
            <Card className="text-center py-16">
              <Target className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <h3 className="text-xl font-semibold mb-2">Your Signals</h3>
              <p className="text-gray-400">Create signals to share with your copiers</p>
            </Card>
          </div>
        )}

        {/* Copy Trader Modal */}
        <AnimatePresence>
          {selectedTrader && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedTrader(null)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md glass-card rounded-2xl p-6 z-50"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-xl font-display font-bold">Copy {selectedTrader.displayName}</h2>
                    <p className="text-sm text-gray-400">Set your copy allocation</p>
                  </div>
                  <button onClick={() => setSelectedTrader(null)} className="text-gray-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-xl bg-white/5 text-center">
                      <p className="text-xs text-gray-400">Win Rate</p>
                      <p className="text-lg font-bold text-white">{selectedTrader.winRate?.toFixed(0) || 0}%</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 text-center">
                      <p className="text-xs text-gray-400">Return</p>
                      <p className={`text-lg font-bold ${selectedTrader.totalReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {selectedTrader.totalReturn >= 0 ? '+' : ''}{selectedTrader.totalReturn?.toFixed(1) || 0}%
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label>Copy Allocation (₹)</Label>
                    <Input
                      type="number"
                      value={copyAmount}
                      onChange={(e) => setCopyAmount(e.target.value)}
                      placeholder="1000"
                      className="mt-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This amount will be used to mirror the trader's positions proportionally.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-400">
                      Copy trading involves risk. Past performance doesn't guarantee future results.
                    </p>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={() => copyMutation.mutate({ traderId: selectedTrader.id, allocation: parseFloat(copyAmount) })}
                  isLoading={copyMutation.isPending}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Start Copying
                </Button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Create Signal Modal */}
        <AnimatePresence>
          {showSignalForm && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowSignalForm(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md glass-card rounded-2xl p-6 z-50"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-xl font-display font-bold">Create Trade Signal</h2>
                    <p className="text-sm text-gray-400">Share with your copiers</p>
                  </div>
                  <button onClick={() => setShowSignalForm(false)} className="text-gray-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <SignalForm 
                  onSubmit={(data) => createSignalMutation.mutate(data)}
                  isLoading={createSignalMutation.isPending}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}

function SignalForm({ onSubmit, isLoading }) {
  const [form, setForm] = useState({
    symbol: '',
    action: 'buy',
    entryPrice: '',
    targetPrice: '',
    stopLoss: '',
    confidence: '70',
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      symbol: form.symbol,
      action: form.action,
      entryPrice: parseFloat(form.entryPrice),
      targetPrice: form.targetPrice ? parseFloat(form.targetPrice) : null,
      stopLoss: form.stopLoss ? parseFloat(form.stopLoss) : null,
      confidence: parseInt(form.confidence),
      notes: form.notes || null
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Symbol</Label>
          <Input
            value={form.symbol}
            onChange={(e) => setForm({...form, symbol: e.target.value.toUpperCase()})}
            placeholder="BTC, AAPL, etc."
            required
          />
        </div>
        <div>
          <Label>Action</Label>
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() => setForm({...form, action: 'buy'})}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                form.action === 'buy'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              BUY
            </button>
            <button
              type="button"
              onClick={() => setForm({...form, action: 'sell'})}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                form.action === 'sell'
                  ? 'bg-red-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              SELL
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Entry Price</Label>
          <Input
            type="number"
            step="0.01"
            value={form.entryPrice}
            onChange={(e) => setForm({...form, entryPrice: e.target.value})}
            required
          />
        </div>
        <div>
          <Label>Target</Label>
          <Input
            type="number"
            step="0.01"
            value={form.targetPrice}
            onChange={(e) => setForm({...form, targetPrice: e.target.value})}
          />
        </div>
        <div>
          <Label>Stop Loss</Label>
          <Input
            type="number"
            step="0.01"
            value={form.stopLoss}
            onChange={(e) => setForm({...form, stopLoss: e.target.value})}
          />
        </div>
      </div>

      <div>
        <Label>Confidence ({form.confidence}%)</Label>
        <input
          type="range"
          min="10"
          max="100"
          value={form.confidence}
          onChange={(e) => setForm({...form, confidence: e.target.value})}
          className="w-full mt-2"
        />
      </div>

      <div>
        <Label>Notes (optional)</Label>
        <Input
          value={form.notes}
          onChange={(e) => setForm({...form, notes: e.target.value})}
          placeholder="Reasoning, analysis..."
        />
      </div>

      <Button type="submit" className="w-full" isLoading={isLoading}>
        <Target className="w-4 h-4 mr-2" />
        Create Signal
      </Button>
    </form>
  );
}
