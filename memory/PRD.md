# Trade Sovereign - Product Requirements Document

## Project Overview
Trade Sovereign is a mobile-first trading super app that combines high-frequency trading analytics, AI-powered insights, and a premium digital marketplace.

## Original Problem Statement
Build Trade Sovereign - a mobile-first trading super app with:
- Firebase Authentication (Google Sign-in)
- Razorpay Payment Gateway
- Gemini 3 Flash AI Assistant (Sovereign AI)
- TradingView Charts Integration
- 3D Immersive UI Design

## Tech Stack
- **Frontend**: React 18, TailwindCSS, Framer Motion
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Auth**: Firebase Admin SDK
- **Payments**: Razorpay
- **AI**: Gemini 3 Flash via Emergent LLM Key

## User Personas
1. **Retail Traders** - Want trading tools, indicators, and AI insights
2. **Professional Traders** - Need advanced analytics and premium subscriptions
3. **Content Creators** - Sell trading courses and digital content
4. **Platform Admin** - Manage products, users, and subscriptions

## Core Features Implemented

### Phase 1 - MVP (Completed Jan 2026)
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

### API Endpoints
- `/api/healthz` - Health check
- `/api/auth/me` - Get current user
- `/api/products` - List/Get products
- `/api/media` - List/Get media items
- `/api/categories` - List categories
- `/api/orders` - User orders
- `/api/payments/create-order` - Razorpay order
- `/api/payments/verify` - Payment verification
- `/api/subscriptions/plans` - Subscription plans
- `/api/rewards/my` - User rewards
- `/api/ai/chat` - AI chat
- `/api/ai/analyze` - Market analysis
- `/api/admin/*` - Admin endpoints

## Prioritized Backlog

### P0 - Critical (Next)
- [ ] Fix external URL routing for preview

### P1 - High Priority
- [ ] Real-time market data via WebSocket
- [ ] Advanced charting tools
- [ ] Portfolio tracking

### P2 - Medium Priority
- [ ] Social trading features
- [ ] Copy trading
- [ ] Push notifications
- [ ] Multi-language support

### P3 - Future
- [ ] Mobile app (React Native)
- [ ] API for third-party integrations
- [ ] White-label solutions

## Credentials Configuration
- Firebase: Project ID `trade-sovereign`
- Admin Email: `bhushanxyz060@gmail.com`
- Razorpay: Live keys configured
- AI: Emergent LLM Key for Gemini 3 Flash

## Seed Data
- 4 Categories (Trading Tools, Indicators, Courses, Templates)
- 4 Products
- 2 Media Items
- 3 Subscription Plans

---
Last Updated: Jan 14, 2026
