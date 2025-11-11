import { useEffect, useRef, useCallback } from "react";
import { workerClient } from "@/lib/worker-client";
import { useAppStore, selectors, type AppState } from "@/store/appStore";
import type { ChatMessage, Settings } from "@shared/schema";
import { db } from "@/lib/db";

interface GenerateOptions {
  userContent: string;
  history: ChatMessage[];
  settings: Settings;
}

export function useAIWorker() {
  const modelState = useAppStore(selectors.modelState);
  const setModelState = useAppStore((s: AppState) => s.setModelState);
  const setModelProgress = useAppStore((s: AppState) => s.setModelProgress);
  const isGenerating = useAppStore(selectors.isGenerating);
  const setIsGenerating = useAppStore((s: AppState) => s.setIsGenerating);
  const settings = useAppStore(selectors.settings);

  const abortRef = useRef<AbortController | null>(null);

  // Worker listener
  useEffect(() => {
    const unsubscribe = workerClient.onMessage((msg) => {
      switch (msg.type) {
        case "initProgress":
          setModelProgress(msg.progress);
          if (modelState === "idle") setModelState("downloading");
          break;
        case "initComplete":
          setModelState("ready");
          setModelProgress(100);
          break;
        case "token":
          // token handled in generate flow via DB writes
          break;
        case "error":
          setModelState("error");
          setIsGenerating(false);
          break;
        case "aborted":
          setIsGenerating(false);
          break;
      }
    });
    return () => { unsubscribe(); };
  }, [modelState, setModelProgress, setModelState, setIsGenerating]);

  const initModel = useCallback((modelId: string) => {
    setModelState("loading");
    workerClient.sendMessage({ type: "init", modelId });
  }, [setModelState]);

  const generate = useCallback(async ({ userContent, history, settings }: GenerateOptions) => {
    if (!history) history = [];
    const sessionId = history[0]?.sessionId; // assume all messages share sessionId
    abortRef.current = new AbortController();
    setIsGenerating(true);

    const orderedContext = history.slice(-settings.contextWindow).map(m => ({ role: m.role, content: m.content }));
    const messages = [
      { role: "system", content: settings.systemPrompt },
      ...orderedContext,
      { role: "user", content: userContent }
    ];

    const assistantMessageId = crypto.randomUUID();
    let streamed = "";
    let tokenCount = 0;
    const start = performance.now();

    const unsubscribe = workerClient.onMessage(async (msg) => {
      if (msg.type === "token") {
        streamed += msg.content;
        tokenCount++;
        if (sessionId) {
          await db.chatMessages.put({ id: assistantMessageId, sessionId, role: "assistant", content: streamed, timestamp: Date.now() });
        }
      } else if (msg.type === "complete") {
        setIsGenerating(false);
        unsubscribe();
        const duration = performance.now() - start;
        if (sessionId) {
          await db.metrics.add({ id: crypto.randomUUID(), sessionId, messageId: assistantMessageId, modelId: settings.modelId, tokensGenerated: tokenCount, responseTimeMs: duration, timestamp: Date.now() });
          await db.chatSessions.update(sessionId, { updatedAt: Date.now() });
        }
      } else if (msg.type === "error") {
        setIsGenerating(false);
        unsubscribe();
      } else if (msg.type === "aborted") {
        setIsGenerating(false);
        unsubscribe();
      }
    });

    workerClient.sendMessage({
      type: "generate",
      messages,
      options: {
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
        top_p: settings.topP,
        frequency_penalty: settings.frequencyPenalty,
        presence_penalty: settings.presencePenalty,
        systemPrompt: settings.systemPrompt,
        responseLength: settings.responseLength,
        responseTone: settings.responseTone,
        customInstructions: settings.customInstructions,
      },
    });
  }, [setIsGenerating, settings]);

  const abort = useCallback(() => {
    workerClient.sendMessage({ type: "abort" });
  }, []);

  return { initModel, generate, abort, modelState, isGenerating, settings };
}
