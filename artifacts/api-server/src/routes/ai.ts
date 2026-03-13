import { Router, IRouter, Request, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db, productsTable, aiSettingsTable } from "@workspace/db";
import { ilike, or } from "drizzle-orm";
import { authenticate, AuthRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60 * 60 * 1000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

function sanitizeInput(input: string): string {
  return input.replace(/[<>]/g, "").trim().slice(0, 2000);
}

async function getGeminiModel(modelOverride?: string): Promise<{ model: ReturnType<GoogleGenerativeAI["getGenerativeModel"]>; promptTemplate: string }> {
  let apiKey = process.env.GEMINI_API_KEY;
  let modelName = modelOverride ?? "gemini-1.5-flash";
  let promptTemplate = "You are Trade Sovereign AI, an expert trading assistant.";

  try {
    const settings = await db.select().from(aiSettingsTable).limit(1);
    if (settings[0]) {
      if (settings[0].apiKey) apiKey = settings[0].apiKey;
      if (settings[0].modelName) modelName = settings[0].modelName;
      if (settings[0].promptTemplate) promptTemplate = settings[0].promptTemplate;
    }
  } catch { /* use defaults */ }

  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");
  const genAI = new GoogleGenerativeAI(apiKey);
  return { model: genAI.getGenerativeModel({ model: modelName }), promptTemplate };
}

/* ── Public AI Settings (model info only, no keys) ── */
router.get("/settings", async (_req: Request, res: Response): Promise<void> => {
  try {
    const settings = await db.select().from(aiSettingsTable).limit(1);
    const s = settings[0];
    res.json({
      modelName: s?.modelName ?? "gemini-1.5-flash",
      hasCustomKey: !!(s?.apiKey),
      rateLimit: RATE_LIMIT,
    });
  } catch {
    res.json({ modelName: "gemini-1.5-flash", hasCustomKey: false, rateLimit: RATE_LIMIT });
  }
});

/* ── Market Analysis ── */
router.post("/analyze", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!checkRateLimit(req.userId!)) {
      res.status(429).json({ error: "Too many requests", message: "Rate limit exceeded. Try again later." });
      return;
    }
    const { query, symbol } = req.body;
    if (!query || typeof query !== "string") { res.status(400).json({ error: "Bad request", message: "Query required" }); return; }
    const safeQuery = sanitizeInput(query);
    const safeSymbol = symbol ? sanitizeInput(symbol) : "general market";
    const { model, promptTemplate } = await getGeminiModel();

    const prompt = `${promptTemplate}

Analyze this trading query and provide structured insights.
Symbol/Asset: ${safeSymbol}
Query: ${safeQuery}

Respond with pure JSON (no markdown):
{
  "analysis": "2-3 paragraph detailed analysis",
  "sentiment": "bullish" | "bearish" | "neutral",
  "keyPoints": ["point 1", "point 2", "point 3", "point 4", "point 5"],
  "disclaimer": "Risk disclaimer text"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    let parsed: any;
    try { parsed = JSON.parse(text); } catch {
      parsed = { analysis: text, sentiment: "neutral", keyPoints: ["See analysis above"], disclaimer: "Not financial advice." };
    }
    res.json({
      analysis: parsed.analysis,
      sentiment: ["bullish", "bearish", "neutral"].includes(parsed.sentiment) ? parsed.sentiment : "neutral",
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints.slice(0, 7) : [],
      disclaimer: parsed.disclaimer ?? "This is not financial advice.",
    });
  } catch (err) {
    console.error("AI analyze error:", err);
    res.status(500).json({ error: "Internal server error", message: "AI analysis failed" });
  }
});

/* ── Smart Product Search ── */
router.post("/search", async (req: Request, res: Response): Promise<void> => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== "string") { res.status(400).json({ error: "Bad request", message: "Query required" }); return; }
    const safeQuery = sanitizeInput(query);
    let interpretation = `Showing results for: "${safeQuery}"`;
    let searchTerms: string[] = [safeQuery];

    try {
      const { model } = await getGeminiModel();
      const prompt = `Extract 2-3 search keywords from this product query for a trading marketplace: "${safeQuery}". Respond with pure JSON: {"terms": ["term1","term2"], "interpretation": "one-line user-friendly description"}`;
      const result = await model.generateContent(prompt);
      const parsed = JSON.parse(result.response.text().trim().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
      searchTerms = parsed.terms ?? [safeQuery];
      interpretation = parsed.interpretation ?? interpretation;
    } catch { /* fall back */ }

    const conditions = searchTerms.flatMap(t => [
      ilike(productsTable.name, `%${t}%`),
      ilike(productsTable.category, `%${t}%`),
    ]);
    const products = await db.select().from(productsTable).where(or(...conditions)).limit(12);
    res.json({
      results: products.map(p => ({ id: p.id, name: p.name, description: p.description, price: parseFloat(p.price), salePrice: p.salePrice ? parseFloat(p.salePrice) : undefined, category: p.category, tags: (p.tags as string[]) ?? [], stock: p.stock, imageUrl: p.imageUrl, isDigital: p.isDigital, isSubscription: p.isSubscription, createdAt: p.createdAt.toISOString() })),
      interpretation,
    });
  } catch (err) {
    console.error("AI search error:", err);
    res.status(500).json({ error: "Internal server error", message: "Search failed" });
  }
});

/* ── AI Chat ── */
router.post("/chat", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!checkRateLimit(req.userId!)) {
      res.status(429).json({ error: "Too many requests", message: "Rate limit exceeded." });
      return;
    }
    const { message, history = [], context } = req.body;
    if (!message || typeof message !== "string") { res.status(400).json({ error: "Bad request", message: "Message required" }); return; }
    const safeMessage = sanitizeInput(message);
    const { model, promptTemplate } = await getGeminiModel();

    const systemPrompt = `${promptTemplate}${context ? `\n\nUser Context: ${sanitizeInput(context)}` : ""}`;
    const historyText = Array.isArray(history)
      ? history.slice(-10).map((m: { role: string; content: string }) => `${m.role === "user" ? "User" : "Assistant"}: ${sanitizeInput(m.content)}`).join("\n")
      : "";

    const fullPrompt = `${systemPrompt}\n\n${historyText ? `Conversation history:\n${historyText}\n\n` : ""}User: ${safeMessage}\n\nAssistant:`;
    const result = await model.generateContent(fullPrompt);
    const reply = result.response.text().trim();

    res.json({ reply, tokensUsed: reply.length });
  } catch (err) {
    console.error("AI chat error:", err);
    res.status(500).json({ error: "Internal server error", message: "Chat failed" });
  }
});

export default router;
