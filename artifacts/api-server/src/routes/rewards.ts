import { Router, IRouter, Response } from "express";
import { db, rewardsTable, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { authenticate, AuthRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

function getTier(points: number): string {
  if (points >= 10000) return "Platinum";
  if (points >= 5000) return "Gold";
  if (points >= 1000) return "Silver";
  return "Bronze";
}

router.get("/my", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [user, history] = await Promise.all([
      db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1),
      db.select().from(rewardsTable)
        .where(eq(rewardsTable.userId, req.userId!))
        .orderBy(sql`${rewardsTable.createdAt} DESC`)
        .limit(50),
    ]);

    const totalPoints = user[0]?.loyaltyPoints ?? 0;
    res.json({
      totalPoints,
      tier: getTier(totalPoints),
      history: history.map(r => ({
        id: r.id,
        points: r.points,
        type: r.type,
        description: r.description,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("Get rewards error:", err);
    res.status(500).json({ error: "Internal server error", message: "Failed to get rewards" });
  }
});

export default router;
