import { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized", message: "Missing or invalid token" });
    return;
  }

  const token = authHeader.slice(7);

  try {
    let decodedToken: { uid: string; email?: string };

    try {
      const { verifyIdToken } = await import("../lib/firebase-admin.js");
      decodedToken = await verifyIdToken(token);
    } catch {
      res.status(401).json({ error: "Unauthorized", message: "Invalid token" });
      return;
    }

    const uid = decodedToken.uid;

    let user = await db.select().from(usersTable).where(eq(usersTable.id, uid)).limit(1);
    if (user.length === 0) {
      const { randomUUID } = await import("crypto");
      await db.insert(usersTable).values({
        id: uid,
        email: decodedToken.email ?? "",
        role: "user",
        loyaltyPoints: 0,
      }).onConflictDoNothing();
      user = await db.select().from(usersTable).where(eq(usersTable.id, uid)).limit(1);
    }

    req.userId = uid;
    req.userRole = user[0]?.role ?? "user";
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(401).json({ error: "Unauthorized", message: "Authentication failed" });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.userRole !== "admin") {
    res.status(403).json({ error: "Forbidden", message: "Admin access required" });
    return;
  }
  next();
}
