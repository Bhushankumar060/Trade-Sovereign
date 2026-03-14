import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '../components/layout/AppLayout';
import { Card, Button, Input, Label, Badge, Spinner } from '../components/ui/DesignSystem';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../lib/utils';
import {
  getBrokerStatus, connectBroker, disconnectBroker,
  getAutoExecutionSettings, updateAutoExecutionSettings,
  getPendingSignals, executeTrade, executeAllPending,
  getExecutionHistory
} from '../lib/api';
import {
  Zap, Settings, Link2, Play, Pause, History,
  TrendingUp, TrendingDown, AlertTriangle, Check, X, 
  Lock, Activity, Target, Shield, RefreshCw, Unlink
} from 'lucide-react';

// Alias for LinkOff (not available in lucide-react)
const LinkOff = Unlink;

const BROKERS = [
  { id: 'demo', name: 'Demo Account', desc: 'Practice with virtual money', icon: '🎮' },
  { id: 'zerodha', name: 'Zerodha', desc: 'India\'s largest broker', icon: '🟢' },
  { id: 'upstox', name: 'Upstox', desc: 'Fast & reliable', icon: '🔵' },
  { id: 'angelone', name: 'Angel One', desc: 'Smart investing', icon: '🟠' },
  { id: 'groww', name: 'Groww', desc: 'Simple investing', icon: '🟣' },
];

export default function AutoExecution() {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('pending');
  const [showBrokerModal, setShowBrokerModal] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState(null);

  const { data: brokerStatus } = useQuery({
    queryKey: ['broker-status'],
    queryFn: getBrokerStatus,
    enabled: !!user,
  });

  const { data: settings } = useQuery({
    queryKey: ['auto-execution-settings'],
    queryFn: getAutoExecutionSettings,
    enabled: !!user,
  });

  const { data: pendingData, refetch: refetchPending } = useQuery({
    queryKey: ['pending-signals'],
    queryFn: getPendingSignals,
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: historyData } = useQuery({
    queryKey: ['execution-history'],
    queryFn: () => getExecutionHistory({ page: 1, limit: 50 }),
    enabled: !!user,
  });

  const connectMutation = useMutation({
    mutationFn: connectBroker,
    onSuccess: () => {
      queryClient.invalidateQueries(['broker-status']);
      setShowBrokerModal(false);
      setSelectedBroker(null);
    },
    onError: (err) => alert(err.response?.data?.detail || 'Failed to connect broker'),
  });

  const disconnectMutation = useMutation({
    mutationFn: disconnectBroker,
    onSuccess: () => queryClient.invalidateQueries(['broker-status']),
  });

  const updateSettingsMutation = useMutation({
    mutationFn: updateAutoExecutionSettings,
    onSuccess: () => queryClient.invalidateQueries(['auto-execution-settings']),
    onError: (err) => alert(err.response?.data?.detail || 'Failed to update settings'),
  });

  const executeMutation = useMutation({
    mutationFn: executeTrade,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['pending-signals']);
      queryClient.invalidateQueries(['execution-history']);
      alert(`Trade executed: ${data.action?.toUpperCase()} ${data.quantity} ${data.symbol}`);
    },
    onError: (err) => alert(err.response?.data?.detail || 'Failed to execute trade'),
  });

  const executeAllMutation = useMutation({
    mutationFn: executeAllPending,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['pending-signals']);
      queryClient.invalidateQueries(['execution-history']);
      alert(data.message);
    },
    onError: (err) => alert(err.response?.data?.detail || 'Failed to execute trades'),
  });

  const pending = pendingData?.signals || [];
  const history = historyData?.executions || [];
  const isConnected = brokerStatus?.connected;

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
          <p className="text-gray-400 mb-8 max-w-md">Access Auto Execution to automate your copy trading.</p>
          <Link to="/login"><Button>Sign In</Button></Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8" data-testid="auto-execution">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <Badge className="mb-3 px-3 py-1">
              <Zap className="w-3 h-3 mr-2" />
              Premium Feature
            </Badge>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
              Auto <span className="text-gradient-primary">Execution</span>
            </h1>
            <p className="text-gray-400">Automatically execute signals from traders you copy</p>
          </div>

          <div className="flex gap-3">
            {isConnected && pending.length > 0 && (
              <Button
                onClick={() => executeAllMutation.mutate()}
                isLoading={executeAllMutation.isPending}
                disabled={!settings?.enabled}
              >
                <Play className="w-4 h-4 mr-2" />
                Execute All ({pending.length})
              </Button>
            )}
            <Button
              variant="glass"
              onClick={() => refetchPending()}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Broker Connection Card */}
        <Card className="mb-8 relative overflow-hidden" hover3d>
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                isConnected 
                  ? 'bg-emerald-500/20 border border-emerald-500/30' 
                  : 'bg-white/5 border border-white/10'
              }`}>
                {isConnected ? (
                  <Link2 className="w-8 h-8 text-emerald-400" />
                ) : (
                  <LinkOff className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {isConnected ? 'Broker Connected' : 'No Broker Connected'}
                </h3>
                {isConnected ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="success">{brokerStatus.broker}</Badge>
                    <span className="text-sm text-gray-400">Ready for trading</span>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Connect a broker to enable auto execution</p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              {isConnected ? (
                <Button
                  variant="destructive"
                  onClick={() => disconnectMutation.mutate()}
                  isLoading={disconnectMutation.isPending}
                >
                  <LinkOff className="w-4 h-4 mr-2" />
                  Disconnect
                </Button>
              ) : (
                <Button onClick={() => setShowBrokerModal(true)}>
                  <Link2 className="w-4 h-4 mr-2" />
                  Connect Broker
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Settings & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Auto Execution Toggle */}
          <Card className="lg:col-span-2">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Settings className="w-4 h-4 text-cyan-400" />
              Execution Settings
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                <div>
                  <p className="font-medium text-white">Auto Execution</p>
                  <p className="text-sm text-gray-400">Automatically execute copied signals</p>
                </div>
                <button
                  onClick={() => updateSettingsMutation.mutate({ 
                    ...settings, 
                    enabled: !settings?.enabled 
                  })}
                  disabled={!isConnected}
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    settings?.enabled ? 'bg-cyan-400' : 'bg-white/10'
                  } ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                    settings?.enabled ? 'left-8' : 'left-1'
                  }`} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Max Trade Size (₹)</Label>
                  <Input
                    type="number"
                    value={settings?.maxTradeSize || 1000}
                    onChange={(e) => updateSettingsMutation.mutate({ 
                      ...settings, 
                      maxTradeSize: parseFloat(e.target.value) 
                    })}
                    disabled={!isConnected}
                  />
                </div>
                <div>
                  <Label>Risk Per Trade (%)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={settings?.riskPerTrade || 2}
                    onChange={(e) => updateSettingsMutation.mutate({ 
                      ...settings, 
                      riskPerTrade: parseFloat(e.target.value) 
                    })}
                    disabled={!isConnected}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings?.autoStopLoss ?? true}
                    onChange={(e) => updateSettingsMutation.mutate({ 
                      ...settings, 
                      autoStopLoss: e.target.checked 
                    })}
                    disabled={!isConnected}
                    className="w-4 h-4 rounded"
                  />
                  Auto Stop Loss
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings?.confirmBeforeExecute ?? true}
                    onChange={(e) => updateSettingsMutation.mutate({ 
                      ...settings, 
                      confirmBeforeExecute: e.target.checked 
                    })}
                    disabled={!isConnected}
                    className="w-4 h-4 rounded"
                  />
                  Confirm Before Execute
                </label>
              </div>
            </div>
          </Card>

          {/* Stats */}
          <Card>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Quick Stats
            </h3>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/5 text-center">
                <p className="text-3xl font-display font-bold text-cyan-400">{pending.length}</p>
                <p className="text-sm text-gray-400">Pending Signals</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 text-center">
                <p className="text-3xl font-display font-bold text-white">{history.length}</p>
                <p className="text-sm text-gray-400">Executed Trades</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'pending', label: 'Pending Signals', icon: Target, count: pending.length },
            { id: 'history', label: 'Execution History', icon: History, count: history.length },
          ].map(tab => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'primary' : 'glass'}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label} ({tab.count})
            </Button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'pending' && (
          <div className="space-y-4">
            {pending.length === 0 ? (
              <Card className="text-center py-16">
                <Target className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <h3 className="text-xl font-semibold mb-2">No Pending Signals</h3>
                <p className="text-gray-400 mb-6">New signals from copied traders will appear here</p>
                <Link to="/copy-trading">
                  <Button variant="glass">Browse Traders to Copy</Button>
                </Link>
              </Card>
            ) : (
              pending.map((signal, idx) => (
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
                            {signal.action?.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-400">
                          by <span className="text-cyan-400">{signal.traderName}</span> • 
                          Entry: {formatCurrency(signal.entryPrice)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right hidden md:block">
                        <p className="text-xs text-gray-400">Confidence</p>
                        <span className="text-sm font-semibold text-cyan-400">{signal.confidence}%</span>
                      </div>
                      {signal.stopLoss && (
                        <Badge variant="warning" className="hidden md:flex">
                          SL: {formatCurrency(signal.stopLoss)}
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        onClick={() => executeMutation.mutate({ signalId: signal.id })}
                        isLoading={executeMutation.isPending}
                        disabled={!isConnected}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Execute
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            {history.length === 0 ? (
              <Card className="text-center py-16">
                <History className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <h3 className="text-xl font-semibold mb-2">No Execution History</h3>
                <p className="text-gray-400">Your executed trades will appear here</p>
              </Card>
            ) : (
              history.map((execution, idx) => (
                <motion.div
                  key={execution.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                >
                  <Card className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        execution.action === 'buy' 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {execution.action === 'buy' ? (
                          <TrendingUp className="w-5 h-5" />
                        ) : (
                          <TrendingDown className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{execution.symbol}</span>
                          <Badge variant={execution.action === 'buy' ? 'success' : 'destructive'} className="text-xs">
                            {execution.action?.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="text-xs">{execution.broker}</Badge>
                        </div>
                        <p className="text-xs text-gray-400">
                          {execution.quantity} units @ {formatCurrency(execution.entryPrice)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <Badge variant={execution.status === 'executed' ? 'success' : 'warning'}>
                        {execution.status === 'executed' ? (
                          <><Check className="w-3 h-3 mr-1" />Executed</>
                        ) : (
                          <><AlertTriangle className="w-3 h-3 mr-1" />Pending</>
                        )}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {execution.executedAt && new Date(execution.executedAt).toLocaleString()}
                      </span>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* Broker Connection Modal */}
        <AnimatePresence>
          {showBrokerModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowBrokerModal(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg glass-card rounded-2xl p-6 z-50"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-xl font-display font-bold">Connect Broker</h2>
                    <p className="text-sm text-gray-400">Select your trading platform</p>
                  </div>
                  <button onClick={() => setShowBrokerModal(false)} className="text-gray-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 mb-6">
                  {BROKERS.map(broker => (
                    <button
                      key={broker.id}
                      onClick={() => setSelectedBroker(broker)}
                      className={`w-full p-4 rounded-xl text-left transition-all ${
                        selectedBroker?.id === broker.id
                          ? 'bg-cyan-400/10 border-2 border-cyan-400/50'
                          : 'bg-white/5 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">{broker.icon}</span>
                        <div>
                          <p className="font-semibold text-white">{broker.name}</p>
                          <p className="text-xs text-gray-400">{broker.desc}</p>
                        </div>
                        {selectedBroker?.id === broker.id && (
                          <Check className="w-5 h-5 text-cyan-400 ml-auto" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {selectedBroker && selectedBroker.id !== 'demo' && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex gap-2 mb-4">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-400">
                      API credentials required. You'll need to generate API keys from your broker's developer portal.
                    </p>
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={() => connectMutation.mutate({ broker: selectedBroker?.id })}
                  isLoading={connectMutation.isPending}
                  disabled={!selectedBroker}
                >
                  <Link2 className="w-4 h-4 mr-2" />
                  Connect {selectedBroker?.name || 'Broker'}
                </Button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
