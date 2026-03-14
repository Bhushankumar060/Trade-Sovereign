# Trade Sovereign - Product Requirements Document

## Overview
Trade Sovereign is a mobile-first trading super-app combining high-frequency trading analytics, AI-powered insights, and a premium digital marketplace.

## Tech Stack
- **Frontend**: React.js with TailwindCSS
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Authentication**: Firebase (Email/Password + Google Sign-In)
- **Payments**: Razorpay
- **AI**: Gemini 3 Flash via Emergent Integrations

## Core Features Implemented

### 1. Authentication (Firebase)
- Email/Password sign-in
- Google Sign-In
- Token-based backend authentication

### 2. Copy Trading
- View list of traders with stats (win rate, returns, copiers)
- Copy traders with custom allocation
- View trade signals from copied traders
- Stop copying traders

### 3. Automated Trade Execution
- Connect broker accounts (Demo, Zerodha, Upstox, AngelOne, Groww)
- Configure auto-execution settings (max trade size, risk per trade)
- Execute signals manually or automatically
- View execution history

### 4. AI Chat (Gemini)
- Trading assistant powered by Gemini 3 Flash
- Market analysis and insights
- Save/load conversation history

### 5. Marketplace
- Digital products and trading tools
- Subscription plans (Free, Pro, Elite)
- Razorpay payment integration
- Loyalty rewards system

### 6. Admin Panel
- Dashboard with stats (users, orders, revenue)
- Product management
- User management
- AI settings configuration

## API Endpoints

### Public
- GET /api/healthz - Health check
- GET /api/products - List products
- GET /api/categories - List categories
- GET /api/copy-trading/traders - List traders
- GET /api/copy-trading/signals - List trade signals

### Authenticated
- GET /api/auth/me - Get current user
- POST /api/ai/chat - AI chat
- POST /api/broker/connect - Connect broker
- GET /api/auto-execution/settings - Get settings
- PUT /api/auto-execution/settings - Update settings
- POST /api/auto-execution/execute - Execute trade

## Database Schema

### Collections
- users: Firebase UID, email, role, loyalty points
- products: name, price, category, stock
- traders: user_id, win_rate, total_return, copiers
- trade_signals: trader_id, symbol, action, entry_price
- broker_connections: user_id, broker, status
- auto_execution_settings: user_id, enabled, max_trade_size
- trade_executions: user_id, signal_id, status

## Environment Variables

### Frontend (.env)
- REACT_APP_BACKEND_URL
- REACT_APP_FIREBASE_API_KEY
- REACT_APP_FIREBASE_AUTH_DOMAIN
- REACT_APP_FIREBASE_PROJECT_ID
- REACT_APP_RAZORPAY_KEY_ID

### Backend (.env)
- MONGO_URL
- DB_NAME
- FIREBASE_PROJECT_ID
- FIREBASE_CLIENT_EMAIL
- FIREBASE_PRIVATE_KEY
- RAZORPAY_KEY_ID
- RAZORPAY_KEY_SECRET
- EMERGENT_LLM_KEY
- ADMIN_EMAIL

## What's Been Completed
- [x] Full-stack application scaffolding
- [x] Firebase Authentication (Email + Google)
- [x] Copy Trading feature
- [x] Automated Trade Execution feature
- [x] AI Chat with Gemini
- [x] Marketplace with products
- [x] Razorpay payment integration
- [x] Loyalty rewards system
- [x] Admin panel
- [x] Logo and banner integration (Trident logo)
- [x] Runtime error fixes (LinkOff icon)

## Pending/Future Tasks
- [ ] Real broker API integration (currently using demo mode)
- [ ] Email notifications for trade signals
- [ ] Push notifications
- [ ] Advanced charting with TradingView
- [ ] Social features (trader profiles, followers)
- [ ] Mobile app (React Native)

## Known Limitations
- Broker integration is MOCKED (demo mode only)
- Google Sign-In requires Firebase project configuration
- No real-time price data integration yet

## Test Reports
- /app/test_reports/iteration_1.json
- /app/test_reports/iteration_2.json
- /app/test_reports/iteration_3.json (Latest - All tests passing)
