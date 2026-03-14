import { Router, IRouter, Request, Response } from "express";
import { db, mediaTable, ordersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { authenticate, AuthRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

export function mapMedia(m: typeof mediaTable.$inferSelect) {
  return {
    id: m.id,
    title: m.title,
    type: m.type,
    price: parseFloat(m.price),
    description: m.description,
    imageUrl: m.imageUrl,
    licenseType: m.licenseType,
    createdAt: m.createdAt.toISOString(),
  };
}

router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, page = "1", limit = "20" } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit));
    const offset = (pageNum - 1) * limitNum;

    const whereClause = type ? eq(mediaTable.type, type) : undefined;
    const [items, countResult] = await Promise.all([
      db.select().from(mediaTable).where(whereClause).limit(limitNum).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(mediaTable).where(whereClause),
    ]);

    res.json({
      items: items.map(mapMedia),
      total: Number(countResult[0]?.count ?? 0),
      page: pageNum,
      limit: limitNum,
    });
  } catch (err) {
    console.error("List media error:", err);
    res.status(500).json({ error: "Internal server error", message: "Failed to list media" });
  }
});

router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const items = await db.select().from(mediaTable).where(eq(mediaTable.id, String(req.params.id))).limit(1);
    if (items.length === 0) {
      res.status(404).json({ error: "Not found", message: "Media item not found" });
      return;
    }
    res.json(mapMedia(items[0]));
  } catch (err) {
    console.error("Get media error:", err);
    res.status(500).json({ error: "Internal server error", message: "Failed to get media item" });
  }
});

router.get("/:id/download", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const items = await db.select().from(mediaTable).where(eq(mediaTable.id, String(req.params.id))).limit(1);
    if (items.length === 0) {
      res.status(404).json({ error: "Not found", message: "Media item not found" });
      return;
    }

    const orders = await db.select().from(ordersTable)
      .where(eq(ordersTable.userId, req.userId!))
      .limit(100);

    const purchased = orders.some(order => {
      if (order.status !== "paid") return false;
      const items = order.items as Array<{ id: string; type: string }>;
      return items.some(item => item.id === String(req.params.id) && item.type === "media");
    });

    if (!purchased && req.userRole !== "admin") {
      res.status(403).json({ error: "Forbidden", message: "Purchase required to download" });
      return;
    }

    const media = items[0];
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    res.json({
      url: media.fileUrl ?? `https://example.com/downloads/${media.id}`,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err) {
    console.error("Download URL error:", err);
    res.status(500).json({ error: "Internal server error", message: "Failed to get download URL" });
  }
});

export default router;
