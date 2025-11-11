import { useState, useEffect, useRef, useCallback } from "react";
import { Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MessageList } from "@/components/MessageList";
import { ChatInput } from "@/components/ChatInput";
import { SettingsPanel } from "@/components/SettingsPanel";
import { ModelStatus, type ModelState } from "@/components/ModelStatus";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/db";
import { loadSettings, saveSettings } from "@/lib/settings";
import { useTheme } from "@/lib/theme";
import { workerClient } from "@/lib/worker-client";
import { speak, isTTSSupported, isSTTSupported } from "@/lib/speech";
import type { ChatSession, ChatMessage, Settings, InsertChatMessage, InsertMetrics } from "@shared/schema";
import { useLiveQuery } from "dexie-react-hooks";

const MESSAGES_PER_PAGE = 50;
const SYSTEM_PROMPT = "You are a helpful AI assistant. Respond in clear, well-formatted GitHub-Flavored Markdown. Use headings, lists, and code blocks when appropriate.";

export default function ChatPage() {
  const [settings, setSettings] = useState<Settings>(loadSettings());
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [modelState, setModelState] = useState<ModelState>("idle");
  const [modelProgress, setModelProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [messageOffset, setMessageOffset] = useState(0);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const streamedContentRef = useRef("");
  
  const { toast } = useToast();
  useTheme(settings.theme);

  const sessions = useLiveQuery(
    () => db.chatSessions.orderBy("updatedAt").reverse().toArray(),
    []
  ) || [];

  const messages = useLiveQuery(
    () => {
      if (!currentSessionId) return [];
      return db.chatMessages
        .where("sessionId")
        .equals(currentSessionId)
        .sortBy("timestamp");
    },
    [currentSessionId]
  ) || [];

  const currentSession = sessions.find(s => s.id === currentSessionId);

  const createSession = useCallback(async (firstMessage?: string): Promise<string> => {
    const now = Date.now();
    const title = firstMessage 
      ? firstMessage.substring(0, 30) + (firstMessage.length > 30 ? "..." : "")
      : "New Conversation";
    
    const sessionId = crypto.randomUUID();
    await db.chatSessions.add({
      id: sessionId,
      title,
      createdAt: now,
      updatedAt: now,
    });
    
    return sessionId;
  }, []);

  const handleNewSession = useCallback(async () => {
    const sessionId = await createSession();
    setCurrentSessionId(sessionId);
    setMessageOffset(0);
    setAutoScroll(true);
  }, [createSession]);

  const handleSelectSession = useCallback((id: string) => {
    setCurrentSessionId(id);
    setMessageOffset(0);
    setAutoScroll(true);
  }, []);

  const handleDeleteSession = useCallback(async (id: string) => {
    await db.chatMessages.where("sessionId").equals(id).delete();
    await db.metrics.where("sessionId").equals(id).delete();
    await db.chatSessions.delete(id);
    
    if (currentSessionId === id) {
      setCurrentSessionId(null);
    }
    
    toast({
      title: "Session deleted",
      description: "Conversation has been removed",
    });
  }, [currentSessionId, toast]);

  const handleSendMessage = useCallback(async (content: string) => {
    let sessionId = currentSessionId;
    
    if (!sessionId) {
      sessionId = await createSession(content);
      setCurrentSessionId(sessionId);
    }

    const userMessageId = crypto.randomUUID();
    const userMessage: InsertChatMessage = {
      sessionId,
      role: "user",
      content,
      timestamp: Date.now(),
    };

    await db.chatMessages.add({ ...userMessage, id: userMessageId });
    await db.chatSessions.update(sessionId, { updatedAt: Date.now() });

    setIsGenerating(true);
    setAutoScroll(true);
    streamedContentRef.current = "";

    abortControllerRef.current = new AbortController();

    const contextMessages = await db.chatMessages
      .where("sessionId")
      .equals(sessionId)
      .reverse()
      .limit(settings.contextWindow)
      .toArray();

    const orderedContext = contextMessages.reverse();
    
    const chatMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...orderedContext.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    const startTime = Date.now();
    const assistantMessageId = crypto.randomUUID();
    let tokenCount = 0;

    const unsubscribe = workerClient.onMessage(async (response) => {
      switch (response.type) {
        case "token":
          streamedContentRef.current += response.content;
          tokenCount++;
          
          await db.chatMessages.put({
            id: assistantMessageId,
            sessionId,
            role: "assistant",
            content: streamedContentRef.current,
            timestamp: Date.now(),
          });
          break;

        case "complete":
          const responseTime = Date.now() - startTime;
          
          if (streamedContentRef.current.trim()) {
            await db.chatMessages.put({
              id: assistantMessageId,
              sessionId,
              role: "assistant",
              content: streamedContentRef.current,
              timestamp: Date.now(),
            });

            const metricsId = crypto.randomUUID();
            await db.metrics.add({
              id: metricsId,
              sessionId,
              messageId: assistantMessageId,
              tokensGenerated: tokenCount,
              responseTimeMs: responseTime,
              timestamp: Date.now(),
            });

            if (settings.enableTTS && isTTSSupported()) {
              speak(streamedContentRef.current);
            }
          }

          await db.chatSessions.update(sessionId, { updatedAt: Date.now() });
          setIsGenerating(false);
          unsubscribe();
          break;

        case "aborted":
          if (streamedContentRef.current.trim()) {
            await db.chatMessages.put({
              id: assistantMessageId,
              sessionId,
              role: "assistant",
              content: streamedContentRef.current,
              timestamp: Date.now(),
            });
            
            await db.chatSessions.update(sessionId, { updatedAt: Date.now() });
          }
          
          setIsGenerating(false);
          unsubscribe();
          toast({
            title: "Generation stopped",
            description: "Partial response has been saved",
          });
          break;

        case "error":
          setIsGenerating(false);
          unsubscribe();
          toast({
            title: "Generation failed",
            description: response.error,
            variant: "destructive",
          });
          break;
      }
    });

    workerClient.sendMessage({
      type: "generate",
      messages: chatMessages,
      options: {
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
      },
    });
  }, [currentSessionId, createSession, settings, toast]);

  const handleStopGeneration = useCallback(() => {
    workerClient.sendMessage({ type: "abort" });
  }, []);

  const handleSaveSettings = useCallback((newSettings: Settings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated",
    });
  }, [toast]);

  const handleLoadMore = useCallback(() => {
    setMessageOffset(prev => prev + MESSAGES_PER_PAGE);
  }, []);

  useEffect(() => {
    const unsubscribe = workerClient.onMessage((message) => {
      if (message.type === "initProgress") {
        setModelState("loading");
        setModelProgress(message.progress);
      } else if (message.type === "initComplete") {
        setModelState("ready");
        setModelProgress(100);
        toast({
          title: "Model loaded",
          description: "AI assistant is ready to chat",
        });
      } else if (message.type === "error" && modelState === "loading") {
        setModelState("error");
        toast({
          title: "Model loading failed",
          description: message.error,
          variant: "destructive",
        });
      }
    });

    workerClient.sendMessage({
      type: "init",
      modelId: settings.modelId,
    });

    return unsubscribe;
  }, [settings.modelId, toast, modelState]);

  useEffect(() => {
    if (sessions.length === 0) {
      handleNewSession();
    }
  }, [sessions.length, handleNewSession]);

  useEffect(() => {
    if (!isSTTSupported() && settings.enableSTT) {
      toast({
        title: "Speech input not available",
        description: "Your browser doesn't support speech recognition",
      });
    }
  }, [settings.enableSTT, toast]);

  const sidebarStyle = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full bg-background">
        <AppSidebar
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSelectSession={handleSelectSession}
          onNewSession={handleNewSession}
          onDeleteSession={handleDeleteSession}
        />

        <div className="flex flex-col flex-1 min-w-0">
          <header className="h-14 border-b border-border flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-3">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <h1 className="text-base font-medium truncate">
                {currentSession?.title || "HRAI Mind v3"}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <ModelStatus state={modelState} progress={modelProgress} />
              
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setSettingsOpen(true)}
                className="h-10 w-10"
                data-testid="button-settings"
              >
                <SettingsIcon className="h-5 w-5" />
              </Button>
            </div>
          </header>

          <MessageList
            messages={messages}
            isGenerating={isGenerating}
            hasMore={hasMoreMessages}
            onLoadMore={handleLoadMore}
            autoScroll={autoScroll}
          />

          <ChatInput
            onSend={handleSendMessage}
            onStop={handleStopGeneration}
            isGenerating={isGenerating}
            disabled={modelState === "loading" || modelState === "error"}
            enableSTT={settings.enableSTT}
          />
        </div>

        <SettingsPanel
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          settings={settings}
          onSave={handleSaveSettings}
        />
      </div>
    </SidebarProvider>
  );
}
