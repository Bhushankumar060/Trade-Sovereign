import { Router, IRouter, Request, Response } from "express";
import { randomUUID } from "crypto";
import { db, productsTable, mediaTable, usersTable, ordersTable, subscriptionsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { authenticate, requireAdmin, AuthRequest } from "../middlewares/auth.js";
import { mapMedia } from "./media.js";

const router: IRouter = Router();

router.use(authenticate as any);
router.use(requireAdmin as any);

router.get("/stats", async (_req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalUsersResult,
      totalOrdersResult,
      totalRevenueResult,
      totalProductsResult,
      totalMediaResult,
      activeSubsResult,
      recentOrders,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(usersTable),
      db.select({ count: sql<number>`count(*)` }).from(ordersTable),
      db.select({ sum: sql<string>`coalesce(sum(total::numeric), 0)` }).from(ordersTable).where(eq(ordersTable.status, "paid")),
      db.select({ count: sql<number>`count(*)` }).from(productsTable),
      db.select({ count: sql<number>`count(*)` }).from(mediaTable),
      db.select({ count: sql<number>`count(*)` }).from(subscriptionsTable).where(eq(subscriptionsTable.status, "active")),
      db.select().from(ordersTable).orderBy(sql`${ordersTable.createdAt} DESC`).limit(10),
    ]);

    res.json({
      totalUsers: Number(totalUsersResult[0]?.count ?? 0),
      totalOrders: Number(totalOrdersResult[0]?.count ?? 0),
      totalRevenue: parseFloat(totalRevenueResult[0]?.sum ?? "0"),
      totalProducts: Number(totalProductsResult[0]?.count ?? 0),
      totalMediaItems: Number(totalMediaResult[0]?.count ?? 0),
      activeSubscriptions: Number(activeSubsResult[0]?.count ?? 0),
      recentOrders: recentOrders.map(o => ({
        id: o.id,
        userId: o.userId,
        razorpayOrderId: o.razorpayOrderId,
        status: o.status,
        total: parseFloat(o.total),
        items: o.items as object[],
        createdAt: o.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    res.status(500).json({ error: "Internal server error", message: "Failed to get stats" });
  }
});

router.get("/products", async (_req: Request, res: Response): Promise<void> => {
  try {
    const products = await db.select().from(productsTable).orderBy(sql`${productsTable.createdAt} DESC`);
    res.json({
      products: products.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: parseFloat(p.price),
        category: p.category,
        stock: p.stock,
        imageUrl: p.imageUrl,
        isDigital: p.isDigital,
        createdAt: p.createdAt.toISOString(),
      })),
      total: products.length,
    });
  } catch (err) {
    console.error("Admin list products error:", err);
    res.status(500).json({ error: "Internal server error", message: "Failed to list products" });
  }
});

router.post("/products", async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, price, category, stock, imageUrl, isDigital } = req.body;
    if (!name || !price || !category) {
      res.status(400).json({ error: "Bad request", message: "Name, price, and category are required" });
      return;
    }
    const id = randomUUID();
    const inserted = await db.insert(productsTable).values({
      id,
      name,
      description,
      price: String(price),
      category,
      stock: stock ?? 0,
      imageUrl,
      isDigital: isDigital ?? false,
    }).returning();
    const p = inserted[0];
    res.status(201).json({
      id: p.id,
      name: p.name,
      description: p.description,
      price: parseFloat(p.price),
      category: p.category,
      stock: p.stock,
      imageUrl: p.imageUrl,
      isDigital: p.isDigital,
      createdAt: p.createdAt.toISOString(),
    });
  } catch (err) {
    console.error("Admin create product error:", err);
    res.status(500).json({ error: "Internal server error", message: "Failed to create product" });
  }
});

router.put("/products/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, price, category, stock, imageUrl, isDigital } = req.body;
    const updated = await db.update(productsTable).set({
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(price !== undefined && { price: String(price) }),
      ...(category && { category }),
      ...(stock !== undefined && { stock }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(isDigital !== undefined && { isDigital }),
    }).where(eq(productsTable.id, req.params.id)).returning();
    if (updated.length === 0) {
      res.status(404).json({ error: "Not found", message: "Product not found" });
      return;
    }
    const p = updated[0];
    res.json({
      id: p.id,
      name: p.name,
      description: p.description,
      price: parseFloat(p.price),
      category: p.category,
      stock: p.stock,
      imageUrl: p.imageUrl,
      isDigital: p.isDigital,
      createdAt: p.createdAt.toISOString(),
    });
  } catch (err) {
    console.error("Admin update product error:", err);
    res.status(500).json({ error: "Internal server error", message: "Failed to update product" });
  }
});

router.delete("/products/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    await db.delete(productsTable).where(eq(productsTable.id, req.params.id));
    res.json({ success: true, message: "Product deleted" });
  } catch (err) {
    console.error("Admin delete product error:", err);
    res.status(500).json({ error: "Internal server error", message: "Failed to delete product" });
  }
});

router.get("/media", async (_req: Request, res: Response): Promise<void> => {
  try {
    const items = await db.select().from(mediaTable).orderBy(sql`${mediaTable.createdAt} DESC`);
    res.json({ items: items.map(mapMedia), total: items.length });
  } catch (err) {
    console.error("Admin list media error:", err);
    res.status(500).json({ error: "Internal server error", message: "Failed to list media" });
  }
});

router.post("/media", async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, type, price, description, imageUrl, fileUrl, licenseType } = req.body;
    if (!title || !type || !price || !licenseType) {
      res.status(400).json({ error: "Bad request", message: "Title, type, price, and licenseType are required" });
      return;
    }
    const id = randomUUID();
    const inserted = await db.insert(mediaTable).values({
      id,
      title,
      type,
      price: String(price),
      description,
      imageUrl,
      fileUrl,
      licenseType,
    }).returning();
    res.status(201).json(mapMedia(inserted[0]));
  } catch (err) {
    console.error("Admin create media error:", err);
    res.status(500).json({ error: "Internal server error", message: "Failed to create media" });
  }
});

router.get("/users", async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await db.select().from(usersTable).orderBy(sql`${usersTable.createdAt} DESC`);
    res.json({
      users: users.map(u => ({
        id: u.id,
        email: u.email,
        displayName: u.displayName,
        role: u.role,
        loyaltyPoints: u.loyaltyPoints,
        createdAt: u.createdAt.toISOString(),
      })),
      total: users.length,
    });
  } catch (err) {
    console.error("Admin list users error:", err);
    res.status(500).json({ error: "Internal server error", message: "Failed to list users" });
  }
});

export default router;
