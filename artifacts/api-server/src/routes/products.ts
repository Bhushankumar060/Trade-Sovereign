import { Router, IRouter, Request, Response } from "express";
import { db, productsTable } from "@workspace/db";
import { eq, ilike, and, sql } from "drizzle-orm";

const router: IRouter = Router();

function mapProduct(p: typeof productsTable.$inferSelect) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: parseFloat(p.price),
    category: p.category,
    stock: p.stock,
    imageUrl: p.imageUrl,
    isDigital: p.isDigital,
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, search, page = "1", limit = "20" } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    if (category) conditions.push(eq(productsTable.category, category));
    if (search) conditions.push(ilike(productsTable.name, `%${search}%`));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [products, countResult] = await Promise.all([
      db.select().from(productsTable).where(whereClause).limit(limitNum).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(productsTable).where(whereClause),
    ]);

    res.json({
      products: products.map(mapProduct),
      total: Number(countResult[0]?.count ?? 0),
      page: pageNum,
      limit: limitNum,
    });
  } catch (err) {
    console.error("List products error:", err);
    res.status(500).json({ error: "Internal server error", message: "Failed to list products" });
  }
});

router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const products = await db.select().from(productsTable).where(eq(productsTable.id, req.params.id)).limit(1);
    if (products.length === 0) {
      res.status(404).json({ error: "Not found", message: "Product not found" });
      return;
    }
    res.json(mapProduct(products[0]));
  } catch (err) {
    console.error("Get product error:", err);
    res.status(500).json({ error: "Internal server error", message: "Failed to get product" });
  }
});

export { mapProduct };
export default router;
