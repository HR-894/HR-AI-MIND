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

    // Build complete system prompt here (application logic, not worker logic)
    let systemPrompt = settings.systemPrompt || "You are a helpful, intelligent AI assistant.";
    
    // Enhanced reliability block with stronger accuracy guidelines
    const reliabilityBlock = `
CRITICAL RELIABILITY GUIDELINES:
- Always prioritize factual accuracy over speculation
- If uncertain about any information, explicitly state: "I am not certain about this"
- Never fabricate data, sources, citations, or statistics
- Do not make up experiences, events, or information
- When you don't know something, admit it clearly
- Provide sources or acknowledge when you cannot verify information
- Distinguish between facts, opinions, and educated guesses
- If asked about recent events or data you weren't trained on, acknowledge the limitation`;
    
    // Add response length instruction
    const lengthInstructions = {
      concise: "Keep your responses brief and to the point. Be direct and concise.",
      balanced: "Provide balanced responses with appropriate detail.",
      detailed: "Provide comprehensive, detailed responses with thorough explanations.",
    };
    
    // Add tone instruction
    const toneInstructions = {
      professional: "Maintain a professional, formal tone.",
      friendly: "Be warm, approachable, and friendly.",
      casual: "Use a casual, conversational style.",
      enthusiastic: "Be energetic, enthusiastic, and encouraging!",
      technical: "Use precise technical language and focus on accuracy.",
    };
    
    const lengthGuide = lengthInstructions[settings.responseLength as keyof typeof lengthInstructions] || "";
    const toneGuide = toneInstructions[settings.responseTone as keyof typeof toneInstructions] || "";
    
    // Combine all instructions
    if (lengthGuide || toneGuide || settings.customInstructions) {
      systemPrompt += "\n\n";
      if (lengthGuide) systemPrompt += lengthGuide + " ";
      if (toneGuide) systemPrompt += toneGuide + " ";
      if (settings.customInstructions) systemPrompt += "\n" + settings.customInstructions;
    }

    // Append enhanced reliability instructions
    if (!systemPrompt.includes("CRITICAL RELIABILITY")) {
      systemPrompt += "\n" + reliabilityBlock;
    }

    const orderedContext = history.slice(-settings.contextWindow).map(m => ({ role: m.role, content: m.content }));
    const messages = [
      { role: "system", content: systemPrompt },
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
