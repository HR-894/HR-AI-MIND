import Dexie, { type Table } from "dexie";
import type { ChatSession, ChatMessage, Metrics } from "@shared/schema";

export class HRAIDatabase extends Dexie {
  chatSessions!: Table<ChatSession, string>;
  chatMessages!: Table<ChatMessage, string>;
  metrics!: Table<Metrics, string>;

  constructor() {
    super("HRAIMindDB");
    
    this.version(1).stores({
      chatSessions: "id, createdAt, updatedAt",
      chatMessages: "id, sessionId, timestamp, role",
      metrics: "id, sessionId, messageId, timestamp",
    });

    // Version 2: Add modelId to metrics for performance tracking
    this.version(2).stores({
      chatSessions: "id, createdAt, updatedAt",
      chatMessages: "id, sessionId, timestamp, role",
      metrics: "id, sessionId, messageId, modelId, timestamp",
    });
  }
}

export const db = new HRAIDatabase();

export async function clearAllData() {
  await db.chatMessages.clear();
  await db.chatSessions.clear();
  await db.metrics.clear();
}
