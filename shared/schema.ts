import { z } from "zod";

export const chatSessionSchema = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const chatMessageSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  timestamp: z.number(),
});

export const metricsSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  messageId: z.string(),
  tokensGenerated: z.number().optional(),
  responseTimeMs: z.number().optional(),
  timestamp: z.number(),
});

export const settingsSchema = z.object({
  modelId: z.string(),
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().min(1).max(4096),
  contextWindow: z.number().min(1).max(50),
  enableSTT: z.boolean(),
  enableTTS: z.boolean(),
  theme: z.enum(["light", "dark", "system"]),
});

export const DEFAULT_SETTINGS: Settings = {
  modelId: "Llama-3.2-1B-Instruct-q4f32_1-MLC",
  temperature: 0.7,
  maxTokens: 2048,
  contextWindow: 10,
  enableSTT: true,
  enableTTS: true,
  theme: "system",
};

export type ChatSession = z.infer<typeof chatSessionSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type Metrics = z.infer<typeof metricsSchema>;
export type Settings = z.infer<typeof settingsSchema>;

export type InsertChatSession = Omit<ChatSession, "id">;
export type InsertChatMessage = Omit<ChatMessage, "id">;
export type InsertMetrics = Omit<Metrics, "id">;
