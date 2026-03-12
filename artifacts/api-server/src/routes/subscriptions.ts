import { Router, IRouter, Response } from "express";
import { db, subscriptionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authenticate, AuthRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    yearlyPrice: 0,
    features: [
      "Browse marketplace",
      "5 AI searches per day",
      "Basic TradingView charts",
      "1 media download per month",
    ],
    isPopular: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: 9.99,
    yearlyPrice: 99.99,
    features: [
      "Everything in Free",
      "50 AI searches per day",
      "Advanced TradingView charts",
      "20 media downloads per month",
      "Priority support",
      "Trade Sovereign AI access",
    ],
    isPopular: true,
  },
  {
    id: "elite",
    name: "Elite",
    price: 24.99,
    yearlyPrice: 249.99,
    features: [
      "Everything in Pro",
      "Unlimited AI searches",
      "Full TradingView suite",
      "Unlimited media downloads",
      "Dedicated account manager",
      "Advanced analytics dashboard",
      "Early access to new features",
    ],
    isPopular: false,
  },
];

router.get("/plans", async (_req, res): Promise<void> => {
  res.json({ plans: PLANS });
});

router.get("/my", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const subs = await db.select().from(subscriptionsTable)
      .where(eq(subscriptionsTable.userId, req.userId!))
      .limit(1);

    if (subs.length === 0) {
      res.json({
        id: "default",
        userId: req.userId!,
        planType: "free",
        status: "active",
        expiresAt: null,
        createdAt: new Date().toISOString(),
      });
      return;
    }

    const sub = subs[0];
    res.json({
      id: sub.id,
      userId: sub.userId,
      planType: sub.planType,
      status: sub.status,
      expiresAt: sub.expiresAt?.toISOString() ?? null,
      createdAt: sub.createdAt.toISOString(),
    });
  } catch (err) {
    console.error("Get subscription error:", err);
    res.status(500).json({ error: "Internal server error", message: "Failed to get subscription" });
  }
});

export default router;
