import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AppLayout from '../components/layout/AppLayout';
import { Button, Card } from '../components/ui/DesignSystem';
import { Activity, Shield, Zap, TrendingUp, Cpu, Globe, ArrowRight, Sparkles } from 'lucide-react';

export default function Home() {
  const features = [
    { icon: Activity, title: 'Advanced Charting', desc: 'Native TradingView integration for pixel-perfect market analysis and real-time data.', color: 'from-cyan-400 to-blue-500' },
    { icon: Cpu, title: 'AI Trade Insights', desc: 'Proprietary Gemini-powered models to interpret market sentiment and identify setups.', color: 'from-purple-400 to-pink-500' },
    { icon: Zap, title: 'Instant Execution', desc: 'Lightning-fast commerce engine for purchasing digital assets and premium subscriptions.', color: 'from-amber-400 to-orange-500' },
    { icon: Shield, title: 'Enterprise Security', desc: 'Bank-grade encryption, secure Razorpay checkouts, and protected media delivery.', color: 'from-emerald-400 to-teal-500' },
    { icon: TrendingUp, title: 'Loyalty Rewards', desc: 'Earn sovereign points on every transaction and climb the elite tier ladders.', color: 'from-rose-400 to-red-500' },
    { icon: Globe, title: 'Global Marketplace', desc: 'Access premium digital goods, exclusive software, and elite multimedia content.', color: 'from-indigo-400 to-violet-500' }
  ];

  return (
    <AppLayout>
      {/* Hero Section */}
      <section className="relative pt-8 pb-32 overflow-hidden">
        {/* Banner Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/banner.png" 
            alt="Trade Sovereign Banner" 
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#070b14]/60 via-[#070b14]/80 to-[#070b14]" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Logo */}
              <div className="flex justify-center mb-8">
                <div className="logo-3d-container">
                  <img 
                    src="/images/logo.png" 
                    alt="Trade Sovereign" 
                    className="w-28 h-28 object-contain logo-hero-3d"
                  />
                </div>
              </div>

              {/* Badge */}
              <div className="inline-flex items-center gap-2 py-2 px-4 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-sm font-semibold mb-8">
                <Sparkles className="w-4 h-4" />
                Enterprise Trading & Commerce
              </div>

              {/* Main Heading */}
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold mb-8 leading-tight" data-testid="hero-title">
                Master the Markets with <br />
                <span className="text-gradient-primary relative">
                  Trade Sovereign
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 400 12" fill="none">
                    <path d="M0 6C100 0 300 12 400 6" stroke="url(#gradient)" strokeWidth="3" strokeLinecap="round"/>
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#22d3ee"/>
                        <stop offset="100%" stopColor="#3b82f6"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </span>
              </h1>

              <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                The ultimate platform combining high-frequency trading analytics, AI-powered insights, and a premium digital marketplace. Elevate your financial sovereignty.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/dashboard" data-testid="cta-dashboard">
                  <Button size="lg" className="w-full sm:w-auto text-lg px-8 group">
                    Launch Platform
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/marketplace" data-testid="cta-marketplace">
                  <Button variant="glass" size="lg" className="w-full sm:w-auto text-lg px-8">
                    Explore Marketplace
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* 3D Floating Cards Preview */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mt-20 relative"
            >
              <div className="relative w-full max-w-3xl mx-auto h-64 perspective-1000">
                <div className="absolute inset-0 flex items-center justify-center gap-4">
                  {['Dashboard', 'AI Chat', 'Analytics'].map((label, i) => (
                    <motion.div
                      key={label}
                      initial={{ rotateY: -15, rotateX: 10 }}
                      animate={{ 
                        rotateY: [-15, -10, -15],
                        rotateX: [10, 5, 10],
                        y: [0, -10, 0]
                      }}
                      transition={{ 
                        duration: 4,
                        delay: i * 0.2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="w-48 h-32 glass-card rounded-2xl p-4 transform-gpu shadow-2xl shadow-cyan-500/10"
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      <div className="text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2">{label}</div>
                      <div className="h-2 bg-white/10 rounded-full mb-2" />
                      <div className="h-2 bg-white/5 rounded-full w-3/4" />
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 relative z-10">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
              Unmatched <span className="text-gradient-primary">Capabilities</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Engineered for professionals who demand excellence, security, and performance.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
              >
                <Card
                  hover3d
                  className="h-full group cursor-pointer"
                  data-testid={`feature-card-${idx}`}
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} p-0.5 mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <div className="w-full h-full rounded-2xl bg-[#0a0f1c] flex items-center justify-center">
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-display font-bold mb-3 text-white group-hover:text-cyan-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-purple-500/10" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center glass-card rounded-3xl p-12"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Ready to Trade <span className="text-gradient-primary">Sovereign</span>?
            </h2>
            <p className="text-gray-400 mb-8 text-lg">
              Join thousands of traders who have elevated their trading game.
            </p>
            <Link to="/register" data-testid="cta-register">
              <Button size="lg" className="px-12">
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </AppLayout>
  );
}
