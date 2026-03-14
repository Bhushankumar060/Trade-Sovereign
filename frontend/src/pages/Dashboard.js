import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AppLayout from '../components/layout/AppLayout';
import { Card, Button, Input, Badge, Spinner } from '../components/ui/DesignSystem';
import { useAuth } from '../contexts/AuthContext';
import { aiAnalyze } from '../lib/api';
import { TrendingUp, Activity, Terminal, Send, AlertTriangle, Sparkles, Lock } from 'lucide-react';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [aiQuery, setAiQuery] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current && user) {
      containerRef.current.innerHTML = '';
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
      script.type = 'text/javascript';
      script.async = true;
      script.innerHTML = JSON.stringify({
        autosize: true,
        symbol: 'NASDAQ:AAPL',
        interval: 'D',
        timezone: 'Etc/UTC',
        theme: 'dark',
        style: '1',
        locale: 'en',
        enable_publishing: false,
        backgroundColor: 'rgba(5, 10, 20, 1)',
        gridColor: 'rgba(255, 255, 255, 0.04)',
        hide_top_toolbar: false,
        hide_legend: false,
        save_image: false,
        container_id: 'tradingview_widget'
      });
      containerRef.current.appendChild(script);
    }
  }, [user]);

  const handleAiSubmit = async (e) => {
    e.preventDefault();
    if (!aiQuery.trim() || aiLoading) return;

    setAiLoading(true);
    try {
      const result = await aiAnalyze({ query: aiQuery, symbol: 'MARKET' });
      setAiResult(result);
    } catch (err) {
      console.error('AI analysis error:', err);
    } finally {
      setAiLoading(false);
    }
  };

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
          <p className="text-gray-400 mb-8 max-w-md">Access the Command Center to view trading analytics and AI insights.</p>
          <Link to="/login">
            <Button>Sign In</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8" data-testid="dashboard">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Command Center</h1>
            <p className="text-gray-400">Welcome back, {user?.displayName || 'Commander'}.</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Badge variant="outline" className="px-3 py-1.5 text-sm bg-black/40">
              <Activity className="w-3 h-3 mr-2 text-cyan-400" />
              System: Nominal
            </Badge>
            <Badge className="px-3 py-1.5 text-sm bg-cyan-400/20 text-cyan-400">
              {user?.loyaltyPoints || 0} PTS
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart Area */}
          <Card className="lg:col-span-2 p-0 overflow-hidden flex flex-col h-[600px]" data-testid="chart-card">
            <div className="p-4 border-b border-white/5 bg-black/20 flex justify-between items-center">
              <h3 className="font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                Advanced Telemetry
              </h3>
            </div>
            <div
              className="flex-1 w-full bg-[#050A14]"
              ref={containerRef}
              id="tradingview_widget"
              data-testid="tradingview-chart"
            />
          </Card>

          {/* AI Panel */}
          <Card className="flex flex-col h-[600px] relative overflow-hidden" data-testid="ai-panel">
            {/* Background Effect */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
              <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/30 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/30 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                  <Terminal className="w-5 h-5 text-black" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-white">Sovereign Intelligence</h3>
                  <p className="text-xs text-gray-400">Powered by Gemini AI</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-4 custom-scrollbar">
                {aiResult ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex justify-between items-center mb-3 pb-3 border-b border-white/10">
                        <span className="text-gray-400 uppercase text-xs tracking-wider">Sentiment</span>
                        <Badge
                          variant={
                            aiResult.sentiment === 'bullish'
                              ? 'success'
                              : aiResult.sentiment === 'bearish'
                              ? 'destructive'
                              : 'warning'
                          }
                        >
                          {aiResult.sentiment?.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed mb-4">{aiResult.analysis}</p>

                      {aiResult.keyPoints?.length > 0 && (
                        <>
                          <h4 className="text-white font-semibold text-xs uppercase mb-2">Key Vectors</h4>
                          <ul className="space-y-2">
                            {aiResult.keyPoints.map((pt, i) => (
                              <li key={i} className="flex gap-2 text-xs text-gray-400">
                                <span className="text-cyan-400 mt-0.5">•</span>
                                {pt}
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>

                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex gap-2 text-xs text-amber-400">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <p>{aiResult.disclaimer}</p>
                    </div>
                  </motion.div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500">
                    <Sparkles className="w-12 h-12 mb-4 opacity-30" />
                    <p className="text-sm">Neural network standby.</p>
                    <p className="text-xs mt-1">Query the market below.</p>
                  </div>
                )}
              </div>

              <form onSubmit={handleAiSubmit} className="mt-auto pt-4 border-t border-white/10 relative">
                <Input
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  placeholder="Analyze macro trends..."
                  className="pr-12 bg-black/50 border-white/10"
                  data-testid="ai-input"
                />
                <Button
                  type="submit"
                  size="icon"
                  variant="ghost"
                  className="absolute right-1 top-5 hover:bg-transparent text-cyan-400"
                  isLoading={aiLoading}
                  data-testid="ai-submit"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {[
            { href: '/marketplace', label: 'Marketplace', desc: 'Browse products' },
            { href: '/chat', label: 'AI Chat', desc: 'Full assistant' },
            { href: '/subscriptions', label: 'Upgrade', desc: 'Premium plans' },
            { href: '/rewards', label: 'Rewards', desc: 'Earn points' }
          ].map((link) => (
            <Link key={link.href} to={link.href}>
              <Card
                hover3d
                className="text-center py-6 cursor-pointer group"
                data-testid={`quick-link-${link.label.toLowerCase()}`}
              >
                <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
                  {link.label}
                </h3>
                <p className="text-xs text-gray-400 mt-1">{link.desc}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
