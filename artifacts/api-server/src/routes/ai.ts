import { Router, IRouter, Request, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db, productsTable } from "@workspace/db";
import { ilike, or } from "drizzle-orm";
import { authenticate, AuthRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
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
  return input.replace(/[<>]/g, "").trim().slice(0, 1000);
}

function getGemini(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");
  return new GoogleGenerativeAI(apiKey);
}

router.post("/analyze", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!checkRateLimit(req.userId!)) {
      res.status(429).json({ error: "Too many requests", message: "Rate limit exceeded. Try again later." });
      return;
    }

    const { query, symbol } = req.body;
    if (!query || typeof query !== "string") {
      res.status(400).json({ error: "Bad request", message: "Query is required" });
      return;
    }

    const safeQuery = sanitizeInput(query);
    const safeSymbol = symbol ? sanitizeInput(symbol) : "general market";

    const genAI = getGemini();
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are a professional financial market analyst for Trade Sovereign platform. 
Analyze the following trading query and provide insights.
Symbol/Asset: ${safeSymbol}
Query: ${safeQuery}

Respond in JSON with exactly this structure (no markdown, pure JSON):
{
  "analysis": "2-3 paragraph detailed analysis",
  "sentiment": "bullish" or "bearish" or "neutral",
  "keyPoints": ["point 1", "point 2", "point 3", "point 4", "point 5"],
  "disclaimer": "Standard financial disclaimer"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    let parsed: { analysis: string; sentiment: string; keyPoints: string[]; disclaimer: string };
    try {
      const cleanText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleanText);
    } catch {
      parsed = {
        analysis: text,
        sentiment: "neutral",
        keyPoints: ["Market analysis provided", "Review the analysis above for details"],
        disclaimer: "This is not financial advice. Past performance does not guarantee future results.",
      };
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

router.post("/search", async (req: Request, res: Response): Promise<void> => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== "string") {
      res.status(400).json({ error: "Bad request", message: "Query is required" });
      return;
    }

    const safeQuery = sanitizeInput(query);

    let interpretation = `Showing results for: "${safeQuery}"`;
    let searchTerms: string[] = [safeQuery];

    try {
      const genAI = getGemini();
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `You are a product search assistant. Extract key search terms from this natural language query for a marketplace.
Query: "${safeQuery}"
Respond with JSON only (no markdown):
{"terms": ["term1", "term2"], "interpretation": "friendly one-line description of what the user wants"}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(text);
      searchTerms = parsed.terms ?? [safeQuery];
      interpretation = parsed.interpretation ?? interpretation;
    } catch {
      // Fall back to direct search
    }

    const conditions = searchTerms.flatMap(term => [
      ilike(productsTable.name, `%${term}%`),
      ilike(productsTable.description ?? productsTable.name, `%${term}%`),
      ilike(productsTable.category, `%${term}%`),
    ]);

    const products = await db.select().from(productsTable).where(or(...conditions)).limit(12);

    res.json({
      results: products.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: parseFloat(p.price),
        category: p.category,
        stock: p.stock,
        imageUrl: p.imageUrl,
        isDigital: p.isDigital,
        createdAt: p.createdAt.toISOString(),
      })),
      interpretation,
    });
  } catch (err) {
    console.error("AI search error:", err);
    res.status(500).json({ error: "Internal server error", message: "Search failed" });
  }
});

export default router;
