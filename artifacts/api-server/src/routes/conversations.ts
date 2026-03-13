import { Router, IRouter, Response } from "express";
import { randomUUID } from "crypto";
import { db, conversationsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { authenticate, AuthRequest } from "../middlewares/auth.js";

const router: IRouter = Router();
router.use(authenticate as any);

function mapConv(c: typeof conversationsTable.$inferSelect) {
  return {
    id: c.id,
    userId: c.userId,
    title: c.title,
    messages: c.messages as object[],
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

router.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const convs = await db.select().from(conversationsTable)
      .where(eq(conversationsTable.userId, req.userId!))
      .orderBy(sql`${conversationsTable.updatedAt} DESC`);
    res.json({ conversations: convs.map(mapConv) });
  } catch (err) {
    console.error("List conversations error:", err);
    res.status(500).json({ error: "Internal server error", message: "Failed to list conversations" });
  }
});

router.post("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, messages } = req.body;
    if (!title || !messages) {
      res.status(400).json({ error: "Bad request", message: "Title and messages are required" });
      return;
    }
    const id = randomUUID();
    const now = new Date();
    const inserted = await db.insert(conversationsTable).values({
      id,
      userId: req.userId!,
      title,
      messages,
      updatedAt: now,
    }).returning();
    res.status(201).json(mapConv(inserted[0]));
  } catch (err) {
    console.error("Save conversation error:", err);
    res.status(500).json({ error: "Internal server error", message: "Failed to save conversation" });
  }
});

router.delete("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const convs = await db.select().from(conversationsTable)
      .where(eq(conversationsTable.id, req.params.id)).limit(1);
    if (!convs[0] || convs[0].userId !== req.userId!) {
      res.status(404).json({ error: "Not found", message: "Conversation not found" });
      return;
    }
    await db.delete(conversationsTable).where(eq(conversationsTable.id, req.params.id));
    res.json({ success: true, message: "Conversation deleted" });
  } catch (err) {
    console.error("Delete conversation error:", err);
    res.status(500).json({ error: "Internal server error", message: "Failed to delete conversation" });
  }
});

export default router;
