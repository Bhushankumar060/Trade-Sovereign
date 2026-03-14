import { Router, IRouter, Request, Response } from "express";
import { db, pagesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function mapPage(p: typeof pagesTable.$inferSelect) {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    content: p.content,
    contentType: p.contentType,
    isPublished: p.isPublished,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    const pages = await db.select().from(pagesTable).where(eq(pagesTable.isPublished, true));
    res.json({ pages: pages.map(mapPage), total: pages.length });
  } catch (err) {
    console.error("List pages error:", err);
    res.status(500).json({ error: "Internal server error", message: "Failed to list pages" });
  }
});

router.get("/:slug", async (req: Request, res: Response): Promise<void> => {
  try {
    const pages = await db.select().from(pagesTable)
      .where(eq(pagesTable.slug, String(req.params.slug)))
      .limit(1);
    if (!pages[0] || !pages[0].isPublished) {
      res.status(404).json({ error: "Not found", message: "Page not found" });
      return;
    }
    res.json(mapPage(pages[0]));
  } catch (err) {
    console.error("Get page error:", err);
    res.status(500).json({ error: "Internal server error", message: "Failed to get page" });
  }
});

export { mapPage };
export default router;
