import { useState, useRef, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, Button, Input, Badge } from "@/components/ui/design-system";
import { useAuth } from "@/contexts/AuthContext";
import { useAiAnalyze } from "@workspace/api-client-react";
import { TrendingUp, Activity, Terminal, Send, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { user } = useAuth();
  const [aiQuery, setAiQuery] = useState("");
  const analyzeMutation = useAiAnalyze();
  
  // TradingView widget reference
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Inject TradingView Advanced Widget script
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
      script.type = "text/javascript";
      script.async = true;
      script.innerHTML = `
        {
          "autosize": true,
          "symbol": "NASDAQ:AAPL",
          "interval": "D",
          "timezone": "Etc/UTC",
          "theme": "dark",
          "style": "1",
          "locale": "en",
          "enable_publishing": false,
          "backgroundColor": "rgba(15, 23, 42, 1)",
          "gridColor": "rgba(255, 255, 255, 0.06)",
          "hide_top_toolbar": false,
          "hide_legend": false,
          "save_image": false,
          "container_id": "tradingview_widget"
        }
      `;
      containerRef.current.appendChild(script);
    }
  }, []);

  const handleAiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery) return;
    analyzeMutation.mutate({ data: { query: aiQuery, symbol: "MARKET" } });
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold">Command Center</h1>
            <p className="text-muted-foreground">Welcome back, {user?.displayName || 'Commander'}.</p>
          </div>
          <div className="flex gap-3">
            <Badge variant="outline" className="px-3 py-1 text-sm bg-black/40"><Activity className="w-3 h-3 mr-2 text-primary" /> System: Nominal</Badge>
            <Badge className="px-3 py-1 text-sm bg-primary/20">{user?.loyaltyPoints || 0} PTS</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart Area */}
          <Card className="lg:col-span-2 p-0 overflow-hidden flex flex-col h-[600px] border-white/5">
            <div className="p-4 border-b border-white/5 bg-black/20 flex justify-between items-center">
              <h3 className="font-semibold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> Advanced Telemetry</h3>
            </div>
            <div className="flex-1 w-full bg-[#0F172A]" ref={containerRef} id="tradingview_widget">
              {/* Script will mount here */}
            </div>
          </Card>

          {/* AI Panel */}
          <Card className="flex flex-col h-[600px] relative overflow-hidden">
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
              <img src={`${import.meta.env.BASE_URL}images/ai-bg.png`} alt="AI" className="w-full h-full object-cover" />
            </div>
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center gap-2 mb-6">
                <Terminal className="w-5 h-5 text-primary" />
                <h3 className="font-display font-bold text-lg text-white">Sovereign Intelligence</h3>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-4 custom-scrollbar">
                {analyzeMutation.data ? (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-sm">
                      <div className="flex justify-between items-center mb-3 pb-3 border-b border-white/10">
                        <span className="text-muted-foreground uppercase text-xs tracking-wider">Sentiment</span>
                        <Badge variant={analyzeMutation.data.sentiment === 'bullish' ? 'success' : analyzeMutation.data.sentiment === 'bearish' ? 'destructive' : 'warning'}>
                          {analyzeMutation.data.sentiment.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-gray-300 leading-relaxed mb-4">{analyzeMutation.data.analysis}</p>
                      
                      <h4 className="text-white font-semibold text-xs uppercase mb-2">Key Vectors</h4>
                      <ul className="space-y-2">
                        {analyzeMutation.data.keyPoints.map((pt, i) => (
                          <li key={i} className="flex gap-2 text-xs text-gray-400">
                            <span className="text-primary mt-0.5">•</span> {pt}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex gap-2 text-xs text-destructive">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <p>{analyzeMutation.data.disclaimer}</p>
                    </div>
                  </motion.div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground opacity-50">
                    <Terminal className="w-12 h-12 mb-4" />
                    <p className="text-sm">Neural network standby. Query the market.</p>
                  </div>
                )}
              </div>

              <form onSubmit={handleAiSubmit} className="mt-auto pt-4 border-t border-white/10 relative">
                <Input 
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  placeholder="Analyze macro trends..." 
                  className="pr-12 bg-black/50 border-white/10"
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  variant="ghost" 
                  className="absolute right-1 bottom-1 hover:bg-transparent text-primary"
                  isLoading={analyzeMutation.isPending}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
