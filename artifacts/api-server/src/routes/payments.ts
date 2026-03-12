import { Router, IRouter, Response } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { randomUUID } from "crypto";
import { db, ordersTable, productsTable, mediaTable, usersTable, rewardsTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import { authenticate, AuthRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

function getRazorpay(): Razorpay {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("Razorpay keys not configured");
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

router.post("/create-order", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { items, type, subscriptionPlan } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: "Bad request", message: "Items are required" });
      return;
    }

    let totalAmount = 0;
    const orderItems: Array<{ id: string; type: string; name: string; price: number; quantity: number }> = [];

    if (type === "subscription") {
      const plans: Record<string, number> = { free: 0, pro: 999, elite: 2499 };
      const price = plans[subscriptionPlan ?? "free"] ?? 0;
      totalAmount = price;
      orderItems.push({ id: subscriptionPlan, type: "subscription", name: `${subscriptionPlan} Plan`, price, quantity: 1 });
    } else {
      for (const item of items) {
        if (item.type === "product") {
          const products = await db.select().from(productsTable).where(eq(productsTable.id, item.id)).limit(1);
          if (products.length > 0) {
            const p = products[0];
            const itemTotal = parseFloat(p.price) * item.quantity * 100;
            totalAmount += itemTotal;
            orderItems.push({ id: p.id, type: "product", name: p.name, price: parseFloat(p.price) * 100, quantity: item.quantity });
          }
        } else if (item.type === "media") {
          const medias = await db.select().from(mediaTable).where(eq(mediaTable.id, item.id)).limit(1);
          if (medias.length > 0) {
            const m = medias[0];
            const itemTotal = parseFloat(m.price) * 100;
            totalAmount += itemTotal;
            orderItems.push({ id: m.id, type: "media", name: m.title, price: parseFloat(m.price) * 100, quantity: 1 });
          }
        }
      }
    }

    if (totalAmount === 0) {
      res.status(400).json({ error: "Bad request", message: "Total amount is zero" });
      return;
    }

    const razorpay = getRazorpay();
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount),
      currency: "INR",
      receipt: randomUUID(),
    });

    const orderId = randomUUID();
    await db.insert(ordersTable).values({
      id: orderId,
      userId: req.userId!,
      razorpayOrderId: razorpayOrder.id,
      status: "pending",
      total: (totalAmount / 100).toFixed(2),
      items: orderItems,
    });

    res.json({
      orderId,
      razorpayOrderId: razorpayOrder.id,
      amount: totalAmount,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID!,
    });
  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ error: "Internal server error", message: "Failed to create order" });
  }
});

router.post("/verify", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      res.status(400).json({ error: "Bad request", message: "Missing payment verification fields" });
      return;
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      res.status(500).json({ error: "Server error", message: "Payment not configured" });
      return;
    }

    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (generatedSignature !== razorpaySignature) {
      res.status(400).json({ error: "Invalid signature", message: "Payment verification failed" });
      return;
    }

    const orders = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);
    if (orders.length === 0) {
      res.status(404).json({ error: "Not found", message: "Order not found" });
      return;
    }

    const order = orders[0];
    if (order.userId !== req.userId!) {
      res.status(403).json({ error: "Forbidden", message: "Not your order" });
      return;
    }

    await db.update(ordersTable).set({
      status: "paid",
      razorpayPaymentId,
    }).where(eq(ordersTable.id, orderId));

    const pointsEarned = Math.floor(parseFloat(order.total) * 10);
    if (pointsEarned > 0) {
      await db.insert(rewardsTable).values({
        id: randomUUID(),
        userId: req.userId!,
        points: pointsEarned,
        type: "purchase",
        description: `Points earned for order #${orderId.slice(0, 8)}`,
      });

      await db.update(usersTable).set({
        loyaltyPoints: (await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1))[0].loyaltyPoints + pointsEarned,
      }).where(eq(usersTable.id, req.userId!));
    }

    res.json({
      success: true,
      orderId,
      message: "Payment verified successfully",
    });
  } catch (err) {
    console.error("Verify payment error:", err);
    res.status(500).json({ error: "Internal server error", message: "Payment verification failed" });
  }
});

export default router;
