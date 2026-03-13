import { Router, type IRouter, type Request, type Response } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { db, usersTable, productsTable, categoriesTable, subscriptionPlansTable, aiSettingsTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/healthz/detailed", async (_req: Request, res: Response): Promise<void> => {
  const checks: Record<string, { status: "ok" | "error" | "warn"; message: string; detail?: string }> = {};
  const startTime = Date.now();

  const checkEnvVar = (name: string): "ok" | "missing" => {
    const val = process.env[name];
    return val && val.length > 4 ? "ok" : "missing";
  };

  checks.env_database_url = {
    status: checkEnvVar("DATABASE_URL") === "ok" ? "ok" : "error",
    message: checkEnvVar("DATABASE_URL") === "ok" ? "DATABASE_URL configured" : "DATABASE_URL missing",
  };
  checks.env_gemini = {
    status: checkEnvVar("GEMINI_API_KEY") === "ok" ? "ok" : "error",
    message: checkEnvVar("GEMINI_API_KEY") === "ok" ? "GEMINI_API_KEY configured" : "GEMINI_API_KEY missing",
    detail: checkEnvVar("GEMINI_API_KEY") === "missing" ? "Go to Google AI Studio and create an API key, then set GEMINI_API_KEY in Replit Secrets." : undefined,
  };
  checks.env_razorpay = {
    status: checkEnvVar("RAZORPAY_KEY_ID") === "ok" && checkEnvVar("RAZORPAY_KEY_SECRET") === "ok" ? "ok" : "error",
    message: checkEnvVar("RAZORPAY_KEY_ID") === "ok" ? "Razorpay keys configured" : "Razorpay keys missing",
    detail: checkEnvVar("RAZORPAY_KEY_ID") === "missing" ? "Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET from your Razorpay Dashboard > Settings > API Keys." : undefined,
  };
  checks.env_firebase_admin = {
    status: checkEnvVar("FIREBASE_PROJECT_ID") === "ok" ? "ok" : "error",
    message: checkEnvVar("FIREBASE_PROJECT_ID") === "ok" ? "Firebase Admin configured" : "FIREBASE_PROJECT_ID missing",
    detail: checkEnvVar("FIREBASE_PROJECT_ID") === "missing" ? "Set FIREBASE_PROJECT_ID in Replit Secrets from your Firebase Console > Project Settings." : undefined,
  };
  checks.env_firebase_client = {
    status: checkEnvVar("VITE_FIREBASE_API_KEY") === "ok" ? "ok" : "error",
    message: checkEnvVar("VITE_FIREBASE_API_KEY") === "ok" ? "Firebase client keys configured" : "VITE_FIREBASE_API_KEY missing",
    detail: checkEnvVar("VITE_FIREBASE_API_KEY") === "missing" ? "Add VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_APP_ID from Firebase Console > Project Settings > Your App." : undefined,
  };

  try {
    await db.execute(sql`SELECT 1`);
    checks.database_connection = { status: "ok", message: "Database connected" };
  } catch (err: any) {
    checks.database_connection = { status: "error", message: "Database connection failed", detail: err.message };
  }

  try {
    const [users, products, cats, plans] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(usersTable),
      db.select({ count: sql<number>`count(*)` }).from(productsTable),
      db.select({ count: sql<number>`count(*)` }).from(categoriesTable),
      db.select({ count: sql<number>`count(*)` }).from(subscriptionPlansTable),
    ]);
    const pCount = Number(products[0]?.count ?? 0);
    const cCount = Number(cats[0]?.count ?? 0);
    const plCount = Number(plans[0]?.count ?? 0);
    const uCount = Number(users[0]?.count ?? 0);

    checks.database_tables = {
      status: pCount > 0 ? "ok" : "warn",
      message: `${uCount} users, ${pCount} products, ${cCount} categories, ${plCount} plans`,
      detail: pCount === 0 ? "Run the seed script: pnpm --filter @workspace/scripts run seed" : undefined,
    };
  } catch (err: any) {
    checks.database_tables = { status: "error", message: "Table query failed", detail: err.message };
  }

  try {
    const settings = await db.select().from(aiSettingsTable).limit(1);
    checks.ai_settings = {
      status: settings.length > 0 ? "ok" : "warn",
      message: settings.length > 0 ? `AI model: ${settings[0].modelName ?? "gemini-1.5-flash"}` : "AI settings not seeded",
      detail: settings.length === 0 ? "Run seed script to initialize AI settings singleton." : undefined,
    };
  } catch (err: any) {
    checks.ai_settings = { status: "error", message: "AI settings query failed", detail: err.message };
  }

  const statusCounts = Object.values(checks);
  const hasErrors = statusCounts.some(c => c.status === "error");
  const hasWarns = statusCounts.some(c => c.status === "warn");

  res.json({
    status: hasErrors ? "degraded" : hasWarns ? "partial" : "healthy",
    uptime: process.uptime(),
    responseTimeMs: Date.now() - startTime,
    checks,
    firebase_setup_guide: {
      step1: "Go to https://console.firebase.google.com and open your project",
      step2: "Enable Authentication: Build > Authentication > Sign-in method > Email/Password (Enable)",
      step3: "Also enable Google Sign-in if needed",
      step4: "Ensure your Replit domain is in Authorized Domains: Authentication > Settings > Authorized domains",
      step5: "If API key error: Firebase Console > Project Settings > General > Web API Key — copy and update VITE_FIREBASE_API_KEY secret",
    },
  });
});

export default router;
