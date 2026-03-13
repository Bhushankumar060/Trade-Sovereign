import { db, productsTable, mediaTable, categoriesTable, aiSettingsTable, subscriptionPlansTable } from "@workspace/db";
import { randomUUID } from "crypto";

const categories = [
  { id: randomUUID(), name: "Hardware", slug: "hardware" },
  { id: randomUUID(), name: "Software", slug: "software" },
  { id: randomUUID(), name: "Data Feeds", slug: "data-feeds" },
  { id: randomUUID(), name: "Crypto Signals", slug: "crypto-signals" },
  { id: randomUUID(), name: "Analytics", slug: "analytics" },
  { id: randomUUID(), name: "Trading Tools", slug: "trading-tools" },
  { id: randomUUID(), name: "AI & ML", slug: "ai-ml" },
  { id: randomUUID(), name: "Education", slug: "education" },
  { id: randomUUID(), name: "Indicators", slug: "indicators" },
  { id: randomUUID(), name: "Options", slug: "options" },
];

const products = [
  { id: randomUUID(), name: "Algorithmic Trading Bot Pro", description: "Advanced automated trading system with ML-based signal generation and backtesting capabilities.", price: "299.99", category: "Trading Tools", tags: ["algo", "automation", "backtesting"], stock: 50, imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400", isDigital: true, isSubscription: false },
  { id: randomUUID(), name: "Market Data API License", description: "Real-time and historical market data API with 10 years of tick data for 50+ exchanges.", price: "149.99", salePrice: "119.99", category: "Data Feeds", tags: ["api", "realtime", "historical"], stock: 100, imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400", isDigital: true, isSubscription: false },
  { id: randomUUID(), name: "Portfolio Risk Analyzer", description: "Professional risk assessment tool with Monte Carlo simulations and VaR calculations.", price: "89.99", category: "Analytics", tags: ["risk", "portfolio", "monte-carlo"], stock: 75, imageUrl: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400", isDigital: true, isSubscription: false },
  { id: randomUUID(), name: "Crypto Signals Dashboard", description: "Live buy/sell signals for top 100 cryptocurrencies with AI sentiment analysis.", price: "59.99", category: "Crypto Signals", tags: ["crypto", "signals", "ai"], stock: 200, imageUrl: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400", isDigital: true, isSubscription: true },
  { id: randomUUID(), name: "Options Strategy Toolkit", description: "Comprehensive options strategy builder with Greeks calculator and P&L charts.", price: "199.99", category: "Options", tags: ["options", "greeks", "strategy"], stock: 30, imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400", isDigital: true, isSubscription: false },
  { id: randomUUID(), name: "Forex EA Builder Suite", description: "No-code Expert Advisor builder for MetaTrader 4/5 with 50+ built-in indicators.", price: "129.99", salePrice: "99.99", category: "Trading Tools", tags: ["forex", "metatrader", "no-code"], stock: 60, imageUrl: "https://images.unsplash.com/photo-1642790551116-18e150f248e3?w=400", isDigital: true, isSubscription: false },
  { id: randomUUID(), name: "Stock Screener Premium", description: "Filter 10,000+ stocks by 200+ fundamental and technical criteria in real-time.", price: "49.99", category: "Analytics", tags: ["stocks", "screener", "realtime"], stock: 500, imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400", isDigital: true, isSubscription: true },
  { id: randomUUID(), name: "Trading Psychology Course", description: "12-week mastery program covering emotional discipline, risk management, and peak performance trading.", price: "399.99", category: "Education", tags: ["psychology", "mindset", "risk"], stock: 999, imageUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400", isDigital: true, isSubscription: false },
  { id: randomUUID(), name: "Quantitative Finance Library", description: "Python library with 300+ quantitative finance functions, backtesting framework, and factor models.", price: "79.99", category: "Software", tags: ["python", "quant", "backtesting"], stock: 1000, imageUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400", isDigital: true, isSubscription: false },
  { id: randomUUID(), name: "Smart Money Concepts Indicator", description: "Advanced TradingView indicator tracking institutional order flow, liquidity zones, and market structure.", price: "39.99", category: "Indicators", tags: ["smc", "tradingview", "institutional"], stock: 2000, imageUrl: "https://images.unsplash.com/photo-1614028674026-a65e31bfd27c?w=400", isDigital: true, isSubscription: false },
  { id: randomUUID(), name: "DeFi Yield Optimizer", description: "Automated DeFi yield farming optimizer with gas fee optimization and auto-compounding.", price: "249.99", category: "Crypto Signals", tags: ["defi", "yield", "automation"], stock: 40, imageUrl: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400", isDigital: true, isSubscription: false },
  { id: randomUUID(), name: "Technical Analysis Masterclass", description: "200+ hours of video lessons covering candlestick patterns, Elliott Wave, and institutional trading secrets.", price: "499.99", salePrice: "349.99", category: "Education", tags: ["technical-analysis", "video", "Elliott-wave"], stock: 999, imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400", isDigital: true, isSubscription: false },
];

const mediaItems = [
  { id: randomUUID(), title: "Market Masters Podcast S1", type: "music", price: "19.99", description: "20 episodes featuring interviews with top hedge fund managers and quant traders.", imageUrl: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400", fileUrl: "https://example.com/media/market-masters-s1.zip", licenseType: "personal" },
  { id: randomUUID(), title: "Trading Floor Documentary", type: "movie", price: "14.99", description: "Award-winning 90-minute documentary inside the world's most secretive trading firms.", imageUrl: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400", fileUrl: "https://example.com/media/trading-floor-doc.mp4", licenseType: "personal" },
  { id: randomUUID(), title: "Quant Finance Lectures Vol. 1", type: "music", price: "29.99", description: "Audio lectures from MIT quant finance course covering stochastic calculus and derivatives pricing.", imageUrl: "https://images.unsplash.com/photo-1481504978070-d554601a60c5?w=400", fileUrl: "https://example.com/media/quant-lectures-1.zip", licenseType: "educational" },
  { id: randomUUID(), title: "The Algorithm (2024)", type: "movie", price: "12.99", description: "Thriller film following a rogue AI trading system that threatens global financial stability.", imageUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400", fileUrl: "https://example.com/media/the-algorithm.mp4", licenseType: "personal" },
  { id: randomUUID(), title: "Crypto Beats: Bull Market Anthology", type: "music", price: "9.99", description: "40-track music collection for focused trading sessions. Lo-fi, jazz, and electronic.", imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400", fileUrl: "https://example.com/media/crypto-beats.zip", licenseType: "personal" },
  { id: randomUUID(), title: "Wall Street Warriors S2", type: "movie", price: "24.99", description: "6-part documentary series following professional traders through bull and bear markets.", imageUrl: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=400", fileUrl: "https://example.com/media/wall-street-warriors-s2.zip", licenseType: "personal" },
  { id: randomUUID(), title: "Focus Flow: Deep Work Beats", type: "music", price: "7.99", description: "Curated instrumental playlist for peak productivity during research and analysis sessions.", imageUrl: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400", fileUrl: "https://example.com/media/focus-flow.zip", licenseType: "personal" },
  { id: randomUUID(), title: "Inside the Fed (Full Documentary)", type: "movie", price: "9.99", description: "Rare inside look at Federal Reserve monetary policy decisions and their market impact.", imageUrl: "https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=400", fileUrl: "https://example.com/media/inside-the-fed.mp4", licenseType: "personal" },
];

const subscriptionPlans = [
  { id: randomUUID(), name: "Free", price: "0.00", yearlyPrice: "0.00", features: ["5 AI queries/month", "Basic marketplace access", "Community forum", "Email support"], isPopular: false },
  { id: randomUUID(), name: "Pro", price: "9.99", yearlyPrice: "99.99", features: ["100 AI queries/month", "Full marketplace access", "AI chat assistant", "Priority support", "Save conversations", "Loyalty rewards 2x"], isPopular: true },
  { id: randomUUID(), name: "Elite", price: "24.99", yearlyPrice: "249.99", features: ["Unlimited AI queries", "Full marketplace access", "Custom AI system prompt", "Dedicated support", "Advanced analytics", "Loyalty rewards 5x", "Early access to new features", "API access"], isPopular: false },
];

await db.insert(categoriesTable).values(categories).onConflictDoNothing();
await db.insert(productsTable).values(products as any).onConflictDoNothing();
await db.insert(mediaTable).values(mediaItems as any).onConflictDoNothing();
await db.insert(subscriptionPlansTable).values(subscriptionPlans as any).onConflictDoNothing();
await db.insert(aiSettingsTable).values({ id: "singleton", modelName: "gemini-1.5-flash", promptTemplate: "You are Trade Sovereign AI, an expert trading assistant helping traders make informed decisions. You have deep knowledge of financial markets, trading strategies, technical analysis, and risk management. Be specific, data-driven, and always include risk disclaimers.", updatedAt: new Date() } as any).onConflictDoNothing();

console.log(`Seeded ${categories.length} categories, ${products.length} products, ${mediaItems.length} media items, ${subscriptionPlans.length} subscription plans.`);
process.exit(0);
