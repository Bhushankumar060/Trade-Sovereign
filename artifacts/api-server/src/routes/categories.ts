import { Router, IRouter, Request, Response } from "express";
import { randomUUID } from "crypto";
import { db, categoriesTable, productsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router: IRouter = Router();

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function mapCategory(c: typeof categoriesTable.$inferSelect) {
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(productsTable)
    .where(eq(productsTable.category, c.name));
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    productCount: Number(countResult[0]?.count ?? 0),
    createdAt: c.createdAt.toISOString(),
  };
}

router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    const cats = await db.select().from(categoriesTable).orderBy(categoriesTable.name);
    const mapped = await Promise.all(cats.map(mapCategory));
    res.json({ categories: mapped, total: mapped.length });
  } catch (err) {
    console.error("List categories error:", err);
    res.status(500).json({ error: "Internal server error", message: "Failed to list categories" });
  }
});

router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const cats = await db.select().from(categoriesTable).where(eq(categoriesTable.id, String(req.params.id))).limit(1);
    if (!cats[0]) { res.status(404).json({ error: "Not found", message: "Category not found" }); return; }
    res.json(await mapCategory(cats[0]));
  } catch (err) {
    console.error("Get category error:", err);
    res.status(500).json({ error: "Internal server error", message: "Failed to get category" });
  }
});

export { slugify };
export default router;
