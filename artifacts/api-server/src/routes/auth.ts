import { Router, IRouter, Response } from "express";
import { db, usersTable, subscriptionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authenticate, AuthRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

router.get("/me", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
    const user = users[0];
    if (!user) {
      res.status(404).json({ error: "Not found", message: "User not found" });
      return;
    }
    res.json({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      loyaltyPoints: user.loyaltyPoints,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (err) {
    console.error("Get me error:", err);
    res.status(500).json({ error: "Internal server error", message: "Failed to get user" });
  }
});

router.put("/profile", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { displayName } = req.body;
    const updated = await db.update(usersTable)
      .set({ displayName })
      .where(eq(usersTable.id, req.userId!))
      .returning();
    const user = updated[0];
    res.json({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      loyaltyPoints: user.loyaltyPoints,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ error: "Internal server error", message: "Failed to update profile" });
  }
});

export default router;
