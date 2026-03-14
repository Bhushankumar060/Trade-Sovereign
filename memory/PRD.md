# Trade Sovereign - Product Requirements Document

## Project Overview
Trade Sovereign is a mobile-first trading super app that combines high-frequency trading analytics, AI-powered insights, copy trading, and a premium digital marketplace.

## Original Problem Statement
Build Trade Sovereign - a mobile-first trading super app with:
- Firebase Authentication (Google Sign-in)
- Razorpay Payment Gateway
- Gemini 3 Flash AI Assistant (Sovereign AI)
- TradingView Charts Integration
- 3D Immersive UI Design
- Copy Trading Functionality (Added Jan 14, 2026)

## Tech Stack
- **Frontend**: React 18, TailwindCSS, Framer Motion
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Auth**: Firebase Admin SDK
- **Payments**: Razorpay
- **AI**: Gemini 3 Flash via Emergent LLM Key

## Firebase Configuration
- Project ID: trade-sovereign
- API Key: AIzaSyAEXj4bLK0I1weKHUhGbRpY5s-kl5YiJ2g
- Auth Domain: trade-sovereign.firebaseapp.com
- App ID: 1:621839937817:web:bf28a8176932d2f9b69588

## User Personas
1. **Retail Traders** - Want trading tools, indicators, and AI insights
2. **Professional Traders** - Need advanced analytics and premium subscriptions
3. **Copy Traders** - Want to mirror successful traders
4. **Signal Providers** - Traders who share signals with copiers
5. **Platform Admin** - Manage products, users, and subscriptions

## Core Features Implemented

### Phase 1 - MVP (Jan 14, 2026)
- [x] Firebase Authentication (Email + Google)
- [x] User role management (Admin/User)
- [x] Product Marketplace with categories
- [x] Media Store (Music/Courses)
- [x] Razorpay Payment Integration
- [x] AI Chat Assistant (Gemini 3 Flash)
- [x] AI Market Analysis
- [x] TradingView Charts Integration
- [x] Subscription Plans (Free/Pro/Elite)
- [x] Loyalty Rewards System
- [x] Order Management
- [x] Admin Panel with CRUD operations
- [x] 3D Glassmorphism UI

### Phase 2 - Copy Trading (Jan 14, 2026)
- [x] Become a Trader registration
- [x] List top traders with stats
- [x] Trader profiles with win rate, return
- [x] Create trade signals (BUY/SELL)
- [x] Copy/Stop copying traders
- [x] View my copies
- [x] Signal confidence levels
- [x] Stop loss and target price
- [x] Verified trader badges

### API Endpoints (40+ endpoints)
**Auth**: /api/auth/me, /api/auth/profile
**Products**: /api/products, /api/products/{id}
**Categories**: /api/categories
**Media**: /api/media, /api/media/{id}
**Orders**: /api/orders
**Payments**: /api/payments/create-order, /api/payments/verify
**Subscriptions**: /api/subscriptions/plans, /api/subscriptions/my
**Rewards**: /api/rewards/my
**AI**: /api/ai/chat, /api/ai/analyze, /api/ai/search, /api/ai/conversations
**Copy Trading**: /api/copy-trading/traders, /api/copy-trading/signals, /api/copy-trading/become-trader, /api/copy-trading/copy/{traderId}, /api/copy-trading/my-copies, /api/copy-trading/my-trader-profile
**Admin**: /api/admin/* (stats, analytics, products, media, users, categories, pages, ai-settings, subscription-plans)

## Test Results (Jan 14, 2026)
- Backend: 95.2% pass rate (20/21 tests)
- Frontend: 100% - All UI components working
- Copy Trading: All APIs functional with seeded data

## Seed Data
- 4 Categories (Trading Tools, Indicators, Courses, Templates)
- 4 Products
- 2 Media Items
- 3 Subscription Plans (Free, Pro, Elite)
- 4 Sample Traders (CryptoMaster, ForexPro, QuantAlpha, SwingKing)
- 3 Sample Trade Signals

## Prioritized Backlog

### P0 - Critical
- [ ] Preview URL wake-up (platform issue)

### P1 - High Priority
- [ ] Real-time signal notifications
- [ ] Portfolio tracking
- [ ] Trade history analytics
- [ ] WebSocket for live signals

### P2 - Medium Priority
- [ ] Social trading feed
- [ ] Trader rankings leaderboard
- [ ] Multi-language support
- [ ] Push notifications

### P3 - Future
- [ ] Mobile app (React Native)
- [ ] API for third-party integrations
- [ ] White-label solutions
- [ ] Automated copy execution

---
Last Updated: Jan 14, 2026
Version: 2.0 (Copy Trading Release)
