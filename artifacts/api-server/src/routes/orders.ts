import { Router, IRouter, Response } from "express";
import { db, ordersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { authenticate, AuthRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

function mapOrder(o: typeof ordersTable.$inferSelect) {
  return {
    id: o.id,
    userId: o.userId,
    razorpayOrderId: o.razorpayOrderId,
    status: o.status,
    total: parseFloat(o.total),
    items: o.items as object[],
    createdAt: o.createdAt.toISOString(),
  };
}

router.get("/", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userOrders = await db.select().from(ordersTable)
      .where(eq(ordersTable.userId, req.userId!))
      .orderBy(sql`${ordersTable.createdAt} DESC`);
    res.json({
      orders: userOrders.map(mapOrder),
      total: userOrders.length,
    });
  } catch (err) {
    console.error("List orders error:", err);
    res.status(500).json({ error: "Internal server error", message: "Failed to list orders" });
  }
});

router.get("/:id", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orders = await db.select().from(ordersTable)
      .where(eq(ordersTable.id, String(req.params.id)))
      .limit(1);
    if (orders.length === 0) {
      res.status(404).json({ error: "Not found", message: "Order not found" });
      return;
    }
    const order = orders[0];
    if (order.userId !== req.userId && req.userRole !== "admin") {
      res.status(403).json({ error: "Forbidden", message: "Not your order" });
      return;
    }
    res.json(mapOrder(order));
  } catch (err) {
    console.error("Get order error:", err);
    res.status(500).json({ error: "Internal server error", message: "Failed to get order" });
  }
});

export { mapOrder };
export default router;
