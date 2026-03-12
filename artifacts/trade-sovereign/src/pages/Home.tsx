import { AppLayout } from "@/components/layout/AppLayout";
import { Button, Card } from "@/components/ui/design-system";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Activity, Shield, Zap, TrendingUp, Cpu, Globe } from "lucide-react";

export default function Home() {
  return (
    <AppLayout>
      {/* Hero Section */}
      <section className="relative pt-32 pb-40 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
            alt="Hero Background" 
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block py-1 px-3 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-6 tracking-wide uppercase">
                Enterprise Trading & Commerce
              </span>
              <h1 className="text-5xl md:text-7xl font-display font-bold mb-8 leading-tight">
                Master the Markets with <br />
                <span className="text-gradient-primary">Trade Sovereign</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
                The ultimate platform combining high-frequency trading analytics, AI-powered insights, and a premium digital marketplace. Elevate your financial sovereignty.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/dashboard">
                  <Button size="lg" className="w-full sm:w-auto text-lg px-8">Launch Platform</Button>
                </Link>
                <Link href="/marketplace">
                  <Button variant="glass" size="lg" className="w-full sm:w-auto text-lg px-8">Explore Marketplace</Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 relative z-10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Unmatched Capabilities</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Engineered for professionals who demand excellence, security, and performance.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Activity, title: "Advanced Charting", desc: "Native TradingView integration for pixel-perfect market analysis and real-time data." },
              { icon: Cpu, title: "AI Trade Insights", desc: "Proprietary Gemini-powered models to interpret market sentiment and identify setups." },
              { icon: Zap, title: "Instant Execution", desc: "Lightning-fast commerce engine for purchasing digital assets and premium subscriptions." },
              { icon: Shield, title: "Enterprise Security", desc: "Bank-grade encryption, secure Razorpay checkouts, and protected media delivery." },
              { icon: TrendingUp, title: "Loyalty Rewards", desc: "Earn sovereign points on every transaction and climb the elite tier ladders." },
              { icon: Globe, title: "Global Marketplace", desc: "Access premium digital goods, exclusive software, and elite multimedia content." }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
              >
                <Card className="h-full hover:-translate-y-1 transition-transform duration-300 group">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
