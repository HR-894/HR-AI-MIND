import { useCallback } from "react";
import { db } from "@/lib/db";
import type { ChatSession, ChatMessage } from "@shared/schema";
import { useLiveQuery } from "dexie-react-hooks";
import { useAppStore, selectors, type AppState } from "@/store/appStore";

export function useChatSessions() {
  const currentSessionId = useAppStore(selectors.currentSessionId);
  const setCurrentSessionId = useAppStore((s: AppState) => s.setCurrentSessionId);

  const sessions = useLiveQuery(() => db.chatSessions.orderBy("updatedAt").reverse().toArray(), [], []);
  const messages = useLiveQuery(() => {
    if (!currentSessionId) return Promise.resolve([] as ChatMessage[]);
    return db.chatMessages.where("sessionId").equals(currentSessionId).sortBy("timestamp");
  }, [currentSessionId], []);

  const createSession = useCallback(async () => {
    const id = crypto.randomUUID();
    const now = Date.now();
    await db.chatSessions.add({ 
      id, 
      title: "New Chat", 
      createdAt: now, 
      updatedAt: now,
      isManuallyRenamed: false // Initialize as not manually renamed
    });
    setCurrentSessionId(id);
    return id;
  }, [setCurrentSessionId]);

  const renameSession = useCallback(async (id: string, title: string) => {
    await db.chatSessions.update(id, { title, updatedAt: Date.now() });
  }, []);

  const deleteSession = useCallback(async (id: string) => {
    await db.chatMessages.where("sessionId").equals(id).delete();
    await db.metrics.where("sessionId").equals(id).delete();
    await db.chatSessions.delete(id);
    if (currentSessionId === id) setCurrentSessionId(null);
  }, [currentSessionId, setCurrentSessionId]);

  return {
    sessions: sessions ?? [],
    messages: messages ?? [],
    currentSessionId,
    setCurrentSessionId,
    createSession,
    renameSession,
    deleteSession,
  };
}
