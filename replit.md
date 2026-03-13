# Trade Sovereign — Enterprise E-Commerce & Trading Platform

## Overview

A production-ready enterprise marketplace and trading platform combining real-time market analytics, AI-powered insights, and a premium digital marketplace.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (Tailwind CSS, Framer Motion, shadcn/ui, wouter routing)
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: Firebase Auth (client-side) + Firebase Admin SDK (server-side token verification)
- **Payments**: Razorpay (order creation + server-side signature verification)
- **AI**: Google Gemini 1.5 Flash (market analysis + smart product search)
- **Charts**: TradingView Lightweight Charts widget (embedded via iframe)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   │   ├── src/
│   │   │   ├── lib/        # firebase-admin.ts
│   │   │   ├── middlewares/ # auth.ts (authenticate, requireAdmin)
│   │   │   └── routes/     # auth, products, media, orders, payments, subscriptions, rewards, ai, admin
│   └── trade-sovereign/    # React + Vite frontend (previewPath: /)
│       ├── src/
│       │   ├── contexts/   # AuthContext, CartContext
│       │   ├── lib/        # firebase.ts, fetch-interceptor.ts
│       │   ├── pages/      # Home, Marketplace, MediaStore, Dashboard, Subscriptions, Orders, Rewards, Admin, Login, Register
│       │   └── components/ # Navbar, CartDrawer, AppLayout, design-system
│       └── public/images/  # AI-generated hero, logo, ai-bg images
├── lib/
│   ├── api-spec/           # OpenAPI 3.1 spec (comprehensive)
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas
│   └── db/                 # Drizzle ORM schema + DB connection
│       └── src/schema/     # users, products, media, orders, subscriptions, rewards
├── scripts/
│   └── src/seed.ts         # Demo data seeder (run: pnpm --filter @workspace/scripts run seed)
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Required Environment Variables

### Secrets (set via Replit Secrets)
- `DATABASE_URL` — PostgreSQL connection string (auto-provisioned by Replit)
- `RAZORPAY_KEY_ID` — Razorpay public key (rzp_*)
- `RAZORPAY_KEY_SECRET` — Razorpay secret key
- `GEMINI_API_KEY` — Google Gemini API key
- `FIREBASE_PROJECT_ID` — Firebase project ID (server-side Admin SDK)
- `VITE_FIREBASE_API_KEY` — Firebase web API key (client-side)
- `VITE_FIREBASE_AUTH_DOMAIN` — Firebase auth domain (client-side)
- `VITE_FIREBASE_PROJECT_ID` — Firebase project ID (client-side)
- `VITE_FIREBASE_APP_ID` — Firebase app ID (client-side)

## Features

1. **Marketplace** — Browse products with dynamic DB categories, AI smart search, sale prices (with % badge), tag filtering, cart
2. **AI Chat** (`/chat`) — Full conversational AI with history sidebar, save/export conversations, starter prompts, typing indicator
3. **Media Store** — Music/movie catalog with purchase-gated download links
4. **Dashboard** — TradingView chart widget + Trade Sovereign AI analysis panel
5. **Subscriptions** — Free/Pro ($9.99)/Elite ($24.99) plans loaded from DB (admin-manageable)
6. **Orders** — Full order history with status tracking
7. **Rewards** — Loyalty points earned on purchases (10pts per ₹), Bronze/Silver/Gold/Platinum tiers
8. **Dynamic Pages** (`/pages/:slug`) — Admin-created pages with Markdown/HTML support, publicly accessible
9. **Admin Panel** — 9-tab control panel:
   - Overview: Stats + recent orders table
   - Analytics: Revenue chart, top products, orders by status (pie), new users (recharts)
   - Products: CRUD with sale price, tags, subscription flag
   - Media Store: CRUD for music/movie items
   - Users: Role management (promote/demote admins)
   - Categories: Dynamic categories CRUD (reflects in marketplace filter)
   - Pages: Page builder with markdown/HTML editor, draft/publish toggle
   - AI Settings: Configure model (gemini-1.5-flash/pro/2.0), system prompt, custom API key
   - Subscription Plans: Full CRUD for subscription tiers
10. **Auth** — Firebase email/password + Google Sign-in. ID tokens sent as Bearer headers
11. **AI** — Gemini-powered market trend analysis, natural language product search, full AI chat (rate limited)

## Security

- **Payment verification**: Server-side Razorpay HMAC-SHA256 signature verification before marking orders paid
- **Auth middleware**: Firebase ID token verification on all protected routes
- **Admin protection**: Role check in Firestore user document (`requireAdmin` middleware)
- **Input sanitization**: All Gemini inputs stripped of HTML tags, max 1000 chars
- **Rate limiting**: 20 AI requests per user per hour (in-memory)
- **Security headers**: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy
- **No sensitive data stored**: Razorpay handles all payment card data

## Development Commands

```bash
# Run full dev environment (all workflows)
# Each workflow starts automatically

# Seed demo data
pnpm --filter @workspace/scripts run seed

# Push DB schema changes
pnpm --filter @workspace/db run push

# Regenerate API client from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen
```

## Database Schema

- `users` — id (Firebase UID), email, displayName, role, loyaltyPoints
- `products` — id, name, description, price, category, stock, imageUrl, isDigital
- `media` — id, title, type (music/movie), price, description, imageUrl, fileUrl, licenseType
- `orders` — id, userId, razorpayOrderId, razorpayPaymentId, status, total, items (JSONB)
- `subscriptions` — id, userId, planType, status, expiresAt
- `rewards` — id, userId, points, type, description
