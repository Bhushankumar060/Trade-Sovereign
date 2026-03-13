import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const aiSettingsTable = pgTable("ai_settings", {
  id: text("id").primaryKey().default("singleton"),
  modelName: text("model_name").notNull().default("gemini-1.5-flash"),
  promptTemplate: text("prompt_template").notNull().default(
    "You are Trade Sovereign AI, an expert trading assistant helping traders make informed decisions. You have deep knowledge of financial markets, trading strategies, technical analysis, and risk management. Be specific, data-driven, and always include risk disclaimers."
  ),
  apiKey: text("api_key"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAiSettingsSchema = createInsertSchema(aiSettingsTable);
export type InsertAiSettings = z.infer<typeof insertAiSettingsSchema>;
export type AiSettings = typeof aiSettingsTable.$inferSelect;
