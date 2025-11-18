import { useEffect, useRef, useCallback } from "react";
import { markModelAsCached } from "@/lib/model-utils";
import { workerClient } from "@/lib/worker-client";
import { useAppStore, selectors, type AppState } from "@/store/appStore";
import type { ChatMessage, Settings } from "@shared/schema";
import { db } from "@/lib/db";
import { getSystemPromptContent } from "@/lib/prompt-formatter";

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
  // Track the last model requested for initialization so we can mark it cached
  const lastInitModelIdRef = useRef<string | null>(null);

  // Worker listener
  useEffect(() => {
    const unsubscribe = workerClient.onMessage((msg) => {
      switch (msg.type) {
        case "initProgress":
          // Always update progress percentage
          setModelProgress(msg.progress);
          // Always update state during initialization to show overlay
          // Phase determines if we're downloading from internet or loading from cache
          const phase = msg.phase || 'loading';
          const newState = phase === 'downloading' ? "downloading" : "loading";
          // Update state if it's different to ensure overlay visibility
          if (modelState !== newState && (modelState === "idle" || modelState === "loading" || modelState === "downloading")) {
            setModelState(newState);
          }
          break;
        case "initComplete":
          setModelState("ready");
          setModelProgress(100);
          // Mark the model as cached so subsequent offline loads are instant
          try {
            if (lastInitModelIdRef.current) {
              markModelAsCached(lastInitModelIdRef.current);
              // Also mark warm-up as completed once per model
              try {
                localStorage.setItem(`warmupDone:${lastInitModelIdRef.current}`, "1");
              } catch {}
            }
          } catch (err) {
            // Non-fatal: caching marker is best-effort
            console.warn("[useAIWorker] Failed to mark model as cached:", err);
          }
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
    lastInitModelIdRef.current = modelId;
    workerClient.sendMessage({ type: "init", modelId });
  }, [setModelState]);

  const generate = useCallback(async ({ userContent, history, settings }: GenerateOptions) => {
    if (!history) history = [];
    const sessionId = history[0]?.sessionId; // assume all messages share sessionId
    abortRef.current = new AbortController();
    setIsGenerating(true);

    // Use the prompt formatter for consistent system prompt generation
    const systemPrompt = getSystemPromptContent(settings);

    // Smart context management: preserve first user message + recent messages
    // This ensures the AI always remembers the original conversation intent
    let orderedContext: { role: string; content: string }[] = [];
    
    if (history.length > 0) {
      const contextLimit = settings.contextWindow;
      
      if (history.length <= contextLimit) {
        // If history fits within context window, use all of it
        orderedContext = history.map(m => ({ role: m.role, content: m.content }));
      } else {
        // Preserve first user message + recent (contextWindow - 1) messages
        const firstUserMessage = history.find(m => m.role === "user");
        const recentMessages = history.slice(-(contextLimit - 1));
        
        // Deduplicate: if first message is already in recent messages, don't add it twice
        const firstMessageInRecent = firstUserMessage && recentMessages.some(
          m => m.id === firstUserMessage.id || (m.content === firstUserMessage.content && m.role === firstUserMessage.role)
        );
        
        if (firstUserMessage && !firstMessageInRecent) {
          orderedContext = [
            { role: firstUserMessage.role, content: firstUserMessage.content },
            ...recentMessages.map(m => ({ role: m.role, content: m.content }))
          ];
        } else {
          orderedContext = recentMessages.map(m => ({ role: m.role, content: m.content }));
        }
      }
    }
    
    // Build messages array - if userContent is provided, add it; otherwise history should already contain it
    const messages = [
      { role: "system", content: systemPrompt },
      ...orderedContext,
      ...(userContent ? [{ role: "user", content: userContent }] : [])
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
