import { Router, IRouter, Request, Response } from "express";
import { randomUUID } from "crypto";
import { db, productsTable, mediaTable, usersTable, ordersTable, subscriptionsTable, categoriesTable, pagesTable, aiSettingsTable, subscriptionPlansTable } from "@workspace/db";
import { eq, sql, gte, and } from "drizzle-orm";
import { authenticate, requireAdmin, AuthRequest } from "../middlewares/auth.js";
import { mapMedia } from "./media.js";
import { mapPage } from "./pages.js";
import { slugify } from "./categories.js";

const router: IRouter = Router();
router.use(authenticate as any);
router.use(requireAdmin as any);

function mapProduct(p: typeof productsTable.$inferSelect) {
  return {
    id: p.id, name: p.name, description: p.description,
    price: parseFloat(p.price),
    salePrice: p.salePrice ? parseFloat(p.salePrice) : undefined,
    category: p.category,
    tags: (p.tags as string[]) ?? [],
    stock: p.stock, imageUrl: p.imageUrl,
    isDigital: p.isDigital, isSubscription: p.isSubscription,
    createdAt: p.createdAt.toISOString(),
  };
}

function mapPlan(p: typeof subscriptionPlansTable.$inferSelect) {
  return {
    id: p.id, name: p.name,
    price: parseFloat(p.price), yearlyPrice: parseFloat(p.yearlyPrice),
    features: (p.features as string[]) ?? [], isPopular: p.isPopular,
  };
}

/* ── Stats ── */
router.get("/stats", async (_req: Request, res: Response): Promise<void> => {
  try {
    const [tu, tor, rev, tp, tm, ts, recent] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(usersTable),
      db.select({ count: sql<number>`count(*)` }).from(ordersTable),
      db.select({ sum: sql<string>`coalesce(sum(total::numeric),0)` }).from(ordersTable).where(eq(ordersTable.status, "paid")),
      db.select({ count: sql<number>`count(*)` }).from(productsTable),
      db.select({ count: sql<number>`count(*)` }).from(mediaTable),
      db.select({ count: sql<number>`count(*)` }).from(subscriptionsTable).where(eq(subscriptionsTable.status, "active")),
      db.select().from(ordersTable).orderBy(sql`${ordersTable.createdAt} DESC`).limit(10),
    ]);
    res.json({
      totalUsers: Number(tu[0]?.count ?? 0),
      totalOrders: Number(tor[0]?.count ?? 0),
      totalRevenue: parseFloat(rev[0]?.sum ?? "0"),
      totalProducts: Number(tp[0]?.count ?? 0),
      totalMediaItems: Number(tm[0]?.count ?? 0),
      activeSubscriptions: Number(ts[0]?.count ?? 0),
      recentOrders: recent.map(o => ({ id: o.id, userId: o.userId, razorpayOrderId: o.razorpayOrderId, status: o.status, total: parseFloat(o.total), items: o.items as object[], createdAt: o.createdAt.toISOString() })),
    });
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error", message: "Failed" }); }
});

/* ── Analytics ── */
router.get("/analytics", async (req: Request, res: Response): Promise<void> => {
  try {
    const period = (req.query.period as string) ?? "30d";
    const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const allOrders = await db.select().from(ordersTable).where(gte(ordersTable.createdAt, since));
    const allUsers = await db.select({ createdAt: usersTable.createdAt }).from(usersTable).where(gte(usersTable.createdAt, since));

    const revenueMap = new Map<string, { revenue: number; orders: number }>();
    const userMap = new Map<string, number>();
    const productSalesMap = new Map<string, { name: string; sales: number; revenue: number }>();
    const statusMap = new Map<string, number>();

    for (let i = 0; i < days; i++) {
      const d = new Date(since.getTime() + i * 86400000);
      const key = d.toISOString().slice(0, 10);
      revenueMap.set(key, { revenue: 0, orders: 0 });
      userMap.set(key, 0);
    }

    for (const o of allOrders) {
      const key = o.createdAt.toISOString().slice(0, 10);
      const entry = revenueMap.get(key) ?? { revenue: 0, orders: 0 };
      if (o.status === "paid") entry.revenue += parseFloat(o.total);
      entry.orders++;
      revenueMap.set(key, entry);

      const sc = statusMap.get(o.status) ?? 0;
      statusMap.set(o.status, sc + 1);

      if (o.status === "paid") {
        const items = o.items as Array<{ id: string; name: string; price: number; quantity: number; type: string }>;
        for (const item of items) {
          if (item.type === "product") {
            const ps = productSalesMap.get(item.id) ?? { name: item.name, sales: 0, revenue: 0 };
            ps.sales += item.quantity ?? 1;
            ps.revenue += item.price * (item.quantity ?? 1);
            productSalesMap.set(item.id, ps);
          }
        }
      }
    }
    for (const u of allUsers) {
      const key = u.createdAt.toISOString().slice(0, 10);
      userMap.set(key, (userMap.get(key) ?? 0) + 1);
    }

    const topProducts = Array.from(productSalesMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
    res.json({
      revenueByDay: Array.from(revenueMap.entries()).map(([date, v]) => ({ date, ...v })),
      topProducts,
      ordersByStatus: Array.from(statusMap.entries()).map(([status, count]) => ({ status, count })),
      newUsersByDay: Array.from(userMap.entries()).map(([date, count]) => ({ date, count })),
    });
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error", message: "Failed" }); }
});

/* ── Products ── */
router.get("/products", async (_req: Request, res: Response): Promise<void> => {
  try {
    const products = await db.select().from(productsTable).orderBy(sql`${productsTable.createdAt} DESC`);
    res.json({ products: products.map(mapProduct), total: products.length });
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error", message: "Failed" }); }
});

router.post("/products", async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, price, salePrice, category, tags, stock, imageUrl, isDigital, isSubscription } = req.body;
    if (!name || !price || !category) { res.status(400).json({ error: "Bad request", message: "Name, price and category required" }); return; }
    const inserted = await db.insert(productsTable).values({
      id: randomUUID(), name, description, price: String(price),
      salePrice: salePrice ? String(salePrice) : null,
      category, tags: tags ?? [], stock: stock ?? 0,
      imageUrl, isDigital: isDigital ?? false, isSubscription: isSubscription ?? false,
    }).returning();
    res.status(201).json(mapProduct(inserted[0]));
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error", message: "Failed" }); }
});

router.put("/products/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, price, salePrice, category, tags, stock, imageUrl, isDigital, isSubscription } = req.body;
    const updated = await db.update(productsTable).set({
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(price !== undefined && { price: String(price) }),
      ...(salePrice !== undefined && { salePrice: salePrice ? String(salePrice) : null }),
      ...(category !== undefined && { category }),
      ...(tags !== undefined && { tags }),
      ...(stock !== undefined && { stock }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(isDigital !== undefined && { isDigital }),
      ...(isSubscription !== undefined && { isSubscription }),
    }).where(eq(productsTable.id, req.params.id)).returning();
    if (!updated[0]) { res.status(404).json({ error: "Not found", message: "Product not found" }); return; }
    res.json(mapProduct(updated[0]));
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error", message: "Failed" }); }
});

router.delete("/products/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    await db.delete(productsTable).where(eq(productsTable.id, req.params.id));
    res.json({ success: true, message: "Product deleted" });
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error", message: "Failed" }); }
});

/* ── Media ── */
router.get("/media", async (_req: Request, res: Response): Promise<void> => {
  try {
    const items = await db.select().from(mediaTable).orderBy(sql`${mediaTable.createdAt} DESC`);
    res.json({ items: items.map(mapMedia), total: items.length });
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error", message: "Failed" }); }
});

router.post("/media", async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, type, price, description, imageUrl, fileUrl, licenseType } = req.body;
    if (!title || !type || !price || !licenseType) { res.status(400).json({ error: "Bad request", message: "Required fields missing" }); return; }
    const inserted = await db.insert(mediaTable).values({ id: randomUUID(), title, type, price: String(price), description, imageUrl, fileUrl, licenseType }).returning();
    res.status(201).json(mapMedia(inserted[0]));
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error", message: "Failed" }); }
});

/* ── Users ── */
router.get("/users", async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await db.select().from(usersTable).orderBy(sql`${usersTable.createdAt} DESC`);
    res.json({ users: users.map(u => ({ id: u.id, email: u.email, displayName: u.displayName, role: u.role, loyaltyPoints: u.loyaltyPoints, createdAt: u.createdAt.toISOString() })), total: users.length });
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error", message: "Failed" }); }
});

router.put("/users/:id/role", async (req: Request, res: Response): Promise<void> => {
  try {
    const { role } = req.body;
    if (!["user", "admin"].includes(role)) { res.status(400).json({ error: "Bad request", message: "Invalid role" }); return; }
    await db.update(usersTable).set({ role }).where(eq(usersTable.id, req.params.id));
    res.json({ success: true, message: "Role updated" });
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error", message: "Failed" }); }
});

/* ── Categories ── */
router.get("/categories", async (_req: Request, res: Response): Promise<void> => {
  try {
    const cats = await db.select().from(categoriesTable).orderBy(categoriesTable.name);
    res.json({ categories: cats.map(c => ({ id: c.id, name: c.name, slug: c.slug, createdAt: c.createdAt.toISOString() })), total: cats.length });
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error", message: "Failed" }); }
});

router.post("/categories", async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, slug } = req.body;
    if (!name) { res.status(400).json({ error: "Bad request", message: "Name required" }); return; }
    const inserted = await db.insert(categoriesTable).values({ id: randomUUID(), name, slug: slug ?? slugify(name) }).returning();
    const c = inserted[0];
    res.status(201).json({ id: c.id, name: c.name, slug: c.slug, productCount: 0, createdAt: c.createdAt.toISOString() });
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error", message: "Failed" }); }
});

router.put("/categories/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, slug } = req.body;
    const updated = await db.update(categoriesTable).set({ ...(name && { name }), ...(slug && { slug }) }).where(eq(categoriesTable.id, req.params.id)).returning();
    if (!updated[0]) { res.status(404).json({ error: "Not found", message: "Category not found" }); return; }
    const c = updated[0];
    res.json({ id: c.id, name: c.name, slug: c.slug, productCount: 0, createdAt: c.createdAt.toISOString() });
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error", message: "Failed" }); }
});

router.delete("/categories/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    await db.delete(categoriesTable).where(eq(categoriesTable.id, req.params.id));
    res.json({ success: true, message: "Category deleted" });
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error", message: "Failed" }); }
});

/* ── Pages ── */
router.get("/pages", async (_req: Request, res: Response): Promise<void> => {
  try {
    const pages = await db.select().from(pagesTable).orderBy(sql`${pagesTable.updatedAt} DESC`);
    res.json({ pages: pages.map(mapPage), total: pages.length });
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error", message: "Failed" }); }
});

router.post("/pages", async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, slug, content, contentType, isPublished } = req.body;
    if (!title || !slug || content === undefined) { res.status(400).json({ error: "Bad request", message: "Title, slug and content required" }); return; }
    const now = new Date();
    const inserted = await db.insert(pagesTable).values({ id: randomUUID(), title, slug, content, contentType: contentType ?? "markdown", isPublished: isPublished ?? false, updatedAt: now }).returning();
    res.status(201).json(mapPage(inserted[0]));
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error", message: "Failed" }); }
});

router.put("/pages/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, slug, content, contentType, isPublished } = req.body;
    const now = new Date();
    const updated = await db.update(pagesTable).set({
      ...(title !== undefined && { title }), ...(slug !== undefined && { slug }),
      ...(content !== undefined && { content }), ...(contentType !== undefined && { contentType }),
      ...(isPublished !== undefined && { isPublished }), updatedAt: now,
    }).where(eq(pagesTable.id, req.params.id)).returning();
    if (!updated[0]) { res.status(404).json({ error: "Not found", message: "Page not found" }); return; }
    res.json(mapPage(updated[0]));
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error", message: "Failed" }); }
});

router.delete("/pages/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    await db.delete(pagesTable).where(eq(pagesTable.id, req.params.id));
    res.json({ success: true, message: "Page deleted" });
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error", message: "Failed" }); }
});

/* ── AI Settings ── */
router.get("/ai-settings", async (_req: Request, res: Response): Promise<void> => {
  try {
    let settings = await db.select().from(aiSettingsTable).limit(1);
    if (!settings[0]) {
      const inserted = await db.insert(aiSettingsTable).values({ id: "singleton", updatedAt: new Date() }).returning();
      settings = inserted;
    }
    const s = settings[0];
    res.json({ id: s.id, modelName: s.modelName, promptTemplate: s.promptTemplate, hasApiKey: !!s.apiKey, updatedAt: s.updatedAt.toISOString() });
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error", message: "Failed" }); }
});

router.put("/ai-settings", async (req: Request, res: Response): Promise<void> => {
  try {
    const { modelName, promptTemplate, apiKey } = req.body;
    const now = new Date();
    await db.insert(aiSettingsTable).values({ id: "singleton", modelName: modelName ?? "gemini-1.5-flash", promptTemplate: promptTemplate ?? "", apiKey, updatedAt: now })
      .onConflictDoUpdate({ target: aiSettingsTable.id, set: { ...(modelName !== undefined && { modelName }), ...(promptTemplate !== undefined && { promptTemplate }), ...(apiKey !== undefined && { apiKey }), updatedAt: now } });
    const settings = await db.select().from(aiSettingsTable).limit(1);
    const s = settings[0];
    res.json({ id: s.id, modelName: s.modelName, promptTemplate: s.promptTemplate, hasApiKey: !!s.apiKey, updatedAt: s.updatedAt.toISOString() });
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error", message: "Failed" }); }
});

/* ── Subscription Plans ── */
router.get("/subscription-plans", async (_req: Request, res: Response): Promise<void> => {
  try {
    const plans = await db.select().from(subscriptionPlansTable).orderBy(subscriptionPlansTable.price);
    res.json({ plans: plans.map(mapPlan) });
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error", message: "Failed" }); }
});

router.post("/subscription-plans", async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, price, yearlyPrice, features, isPopular } = req.body;
    if (!name || price === undefined) { res.status(400).json({ error: "Bad request", message: "Name and price required" }); return; }
    const inserted = await db.insert(subscriptionPlansTable).values({ id: randomUUID(), name, price: String(price), yearlyPrice: String(yearlyPrice ?? price * 10), features: features ?? [], isPopular: isPopular ?? false }).returning();
    res.status(201).json(mapPlan(inserted[0]));
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error", message: "Failed" }); }
});

router.put("/subscription-plans/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, price, yearlyPrice, features, isPopular } = req.body;
    const updated = await db.update(subscriptionPlansTable).set({
      ...(name !== undefined && { name }), ...(price !== undefined && { price: String(price) }),
      ...(yearlyPrice !== undefined && { yearlyPrice: String(yearlyPrice) }),
      ...(features !== undefined && { features }), ...(isPopular !== undefined && { isPopular }),
    }).where(eq(subscriptionPlansTable.id, req.params.id)).returning();
    if (!updated[0]) { res.status(404).json({ error: "Not found", message: "Plan not found" }); return; }
    res.json(mapPlan(updated[0]));
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error", message: "Failed" }); }
});

router.delete("/subscription-plans/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    await db.delete(subscriptionPlansTable).where(eq(subscriptionPlansTable.id, req.params.id));
    res.json({ success: true, message: "Plan deleted" });
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error", message: "Failed" }); }
});

export default router;
