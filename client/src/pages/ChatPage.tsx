import { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import { Settings as SettingsIcon, Home, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MessageList } from "@/components/MessageList";
import { ChatInput } from "@/components/ChatInput";
import { ModelStatus, type ModelState } from "@/components/ModelStatus";
import { ModelLoadingOverlay } from "@/components/ModelLoadingOverlay";
import { ModelDownloadManager } from "@/components/ModelDownloadManager";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/db";
import { loadSettings, saveSettings } from "@/lib/settings";
import { useTheme } from "@/lib/theme";
import { workerClient } from "@/lib/worker-client";
import { speak, isTTSSupported, isSTTSupported } from "@/lib/speech";
import type { ChatSession, ChatMessage, Settings, InsertChatMessage, InsertMetrics } from "@shared/schema";
import { useLiveQuery } from "dexie-react-hooks";

// Lazy load heavy components
const SettingsPanel = lazy(() => import("@/components/SettingsPanel").then(m => ({ default: m.SettingsPanel })));
const ExportDialog = lazy(() => import("@/components/ExportDialog").then(m => ({ default: m.ExportDialog })));
const ChatBackground = lazy(() => import("@/components/ChatBackground").then(m => ({ default: m.ChatBackground })));

// Lazy load export function
const exportChat = async (...args: Parameters<typeof import("@/lib/export-chat").exportChat>) => {
  const { exportChat: fn } = await import("@/lib/export-chat");
  return fn(...args);
};

const MESSAGES_PER_PAGE = 50;
const SYSTEM_PROMPT = "You are a helpful AI assistant. Respond in clear, well-formatted GitHub-Flavored Markdown. Use headings, lists, and code blocks when appropriate.";

interface ChatPageProps {
  onNavigateToHome?: () => void;
}

export default function ChatPage({ onNavigateToHome }: ChatPageProps = {}) {
  const [settings, setSettings] = useState<Settings>(loadSettings());
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [modelState, setModelState] = useState<ModelState>("idle");
  const [modelProgress, setModelProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportingSessionId, setExportingSessionId] = useState<string | null>(null);
  const [messageOffset, setMessageOffset] = useState(0);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [isDownloadingModel, setIsDownloadingModel] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const streamedContentRef = useRef("");
  const downloadListenerRef = useRef<(() => void) | null>(null);
  const hasCreatedInitialSession = useRef(false);
  
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

  const handleRenameSession = useCallback(async (id: string, newTitle: string) => {
    await db.chatSessions.update(id, { 
      title: newTitle,
      updatedAt: Date.now() 
    });
    
    toast({
      title: "Session renamed",
      description: `Chat renamed to "${newTitle}"`,
    });
  }, [toast]);

  const handleDownloadSession = useCallback((id: string) => {
    setExportingSessionId(id);
    setExportDialogOpen(true);
  }, []);

  const handleExportChat = useCallback(async (
    format: "txt" | "md" | "json" | "html",
    options: { includeTimestamps: boolean; includeMetadata: boolean }
  ) => {
    if (!exportingSessionId) return;

    const session = sessions.find(s => s.id === exportingSessionId);
    if (!session) return;

    const sessionMessages = await db.chatMessages
      .where("sessionId")
      .equals(exportingSessionId)
      .toArray();

    await exportChat(session, sessionMessages, { format, ...options });

    toast({
      title: "Chat exported",
      description: `Successfully downloaded as ${format.toUpperCase()}`,
    });
  }, [exportingSessionId, sessions, toast]);

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
              modelId: settings.modelId,
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
        // Persona settings
        systemPrompt: settings.systemPrompt,
        responseLength: settings.responseLength,
        responseTone: settings.responseTone,
        customInstructions: settings.customInstructions,
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

  // Auto-load model when chat opens (only if already cached)
  useEffect(() => {
    const initModel = async () => {
      // Debug: Check localStorage
      const stored = localStorage.getItem('webllm_downloaded_models');
      console.log('[ChatPage] localStorage webllm_downloaded_models:', stored);
      
      // Check if model is already cached
      const { isModelCached } = await import("@/lib/model-utils");
      const isCached = await isModelCached(settings.modelId);
      
      console.log(`[ChatPage] Checking model ${settings.modelId}, cached:`, isCached);
      
      if (isCached) {
        // Model is cached, start loading immediately
        // Progress will be handled by persistent listener above
        console.log('[ChatPage] Model is cached, starting auto-load');
        setModelState("loading");
        workerClient.sendMessage({
          type: "init",
          modelId: settings.modelId,
        });
      } else {
        // Model not cached, stay in idle state - user must download first
        console.log("Model not cached, staying in idle state");
        setModelState("idle");
      }
    };

    initModel();
  }, [settings.modelId]);

  // Persistent download listener - stays active even when dropdown closes
  useEffect(() => {
    console.log('[ChatPage] Setting up persistent download listener');
    
    const unsubscribe = workerClient.onMessage(async (message) => {
      if (message.type === "initProgress") {
        console.log(`[ChatPage] Download/Load progress: ${message.progress}%`);
        setModelProgress(message.progress);
        
        // If we're getting progress and state is idle, switch to downloading
        if (modelState === "idle") {
          setModelState("downloading");
        }
      } else if (message.type === "initComplete") {
        console.log('[ChatPage] Download/Load complete!');
        setModelProgress(100);
        setModelState("ready");
        setIsDownloadingModel(false);
        
        // Mark model as cached
        const { markModelAsCached } = await import("@/lib/model-utils");
        markModelAsCached(settings.modelId);
        
        toast({
          title: "Model Ready",
          description: "AI assistant is ready to chat!",
        });
      } else if (message.type === "error") {
        console.error('[ChatPage] Model error:', message.error);
        setModelState("error");
        setIsDownloadingModel(false);
        toast({
          title: "Model Error",
          description: message.error,
          variant: "destructive",
        });
      }
    });

    // Store ref so we can clean up properly
    downloadListenerRef.current = unsubscribe;

    return () => {
      console.log('[ChatPage] Cleaning up persistent listener');
      if (downloadListenerRef.current) {
        downloadListenerRef.current();
      }
    };
  }, [modelState, settings.modelId, toast]); // Re-run when these change

  useEffect(() => {
    // Only create initial session once on mount if no sessions exist
    if (sessions.length === 0 && !hasCreatedInitialSession.current) {
      hasCreatedInitialSession.current = true;
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
      <Suspense fallback={null}>
        <ChatBackground />
      </Suspense>
      <div className="flex h-screen w-full">
        <AppSidebar
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSelectSession={handleSelectSession}
          onNewSession={handleNewSession}
          onDeleteSession={handleDeleteSession}
          onRenameSession={handleRenameSession}
          onDownloadSession={handleDownloadSession}
        />

        <div className="flex flex-col flex-1 min-w-0">
          {/* Show draggable PiP when model is loading or downloading */}
          {(modelState === "loading" || modelState === "downloading") && (
            <ModelLoadingOverlay 
              progress={modelProgress} 
              modelName={settings.modelId}
            />
          )}

          {/* App Title Header */}
          <div className="border-b border-border bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
            <div className="px-4 py-3 flex justify-center">
              <div className="inline-flex items-center justify-center px-6 py-2 rounded-2xl bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl border-2 border-white/60 dark:border-gray-700/60 shadow-2xl">
                <h1 className="text-2xl font-black tracking-wider">
                  <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    H R
                  </span>
                  <span className="mx-2 text-gray-400">•</span>
                  <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                    A I
                  </span>
                  <span className="mx-2 text-gray-400">•</span>
                  <span className="bg-gradient-to-r from-pink-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                    M I N D
                  </span>
                </h1>
              </div>
            </div>
            
            {/* Navigation Tabs */}
            <div className="flex items-center justify-center px-4 pb-3 pt-1 bg-gradient-to-b from-indigo-50/50 via-purple-50/30 to-transparent dark:from-indigo-950/30 dark:via-purple-950/20 dark:to-transparent backdrop-blur-sm">
              <Tabs defaultValue="chat" className="w-full max-w-md">
                <TabsList className="grid w-full grid-cols-2 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border border-indigo-200/50 dark:border-indigo-700/50 shadow-lg p-1">
                  <TabsTrigger 
                    value="home" 
                    onClick={onNavigateToHome}
                    className="relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all duration-300 data-[state=inactive]:text-gray-600 dark:data-[state=inactive]:text-gray-400 rounded-md"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Home
                  </TabsTrigger>
                  <TabsTrigger 
                    value="chat"
                    className="relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all duration-300 data-[state=inactive]:text-gray-600 dark:data-[state=inactive]:text-gray-400 rounded-md"
                  >
                    Chat
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Chat Header */}
          <header className="h-16 border-b border-border flex items-center justify-between px-4 shrink-0 gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <h2 className="text-sm font-medium truncate text-muted-foreground">
                {currentSession?.title || "New Conversation"}
              </h2>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <ModelDownloadManager 
                currentModelId={settings.modelId}
                onModelChange={(modelId) => {
                  const newSettings = { ...settings, modelId };
                  setSettings(newSettings);
                  saveSettings(newSettings);
                }}
                modelState={modelState}
                onDownloadStateChange={(state) => {
                  if (state === "downloading") {
                    console.log('[ChatPage] Download started from dropdown');
                    setIsDownloadingModel(true);
                    // State and progress are handled by persistent listener
                  }
                }}
              />
              
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

          {/* Show message when no model is ready and not downloading */}
          {modelState !== "ready" && modelState !== "generating" && modelState !== "downloading" && messages.length === 0 && (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="max-w-md text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 flex items-center justify-center">
                  <Download className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold">No AI Model Downloaded</h3>
                <p className="text-muted-foreground">
                  Please download an AI model first using the dropdown above to start chatting.
                </p>
                <div className="pt-2">
                  <ModelDownloadManager 
                    currentModelId={settings.modelId}
                    onModelChange={(modelId) => {
                      const newSettings = { ...settings, modelId };
                      setSettings(newSettings);
                      saveSettings(newSettings);
                    }}
                    modelState={modelState}
                    onDownloadStateChange={(state) => {
                      if (state === "downloading") {
                        console.log('[ChatPage] Download started from validation screen');
                        setIsDownloadingModel(true);
                        // State and progress are handled by persistent listener
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {(modelState === "ready" || modelState === "generating" || messages.length > 0) && (
            <MessageList
              messages={messages}
              isGenerating={isGenerating}
              hasMore={hasMoreMessages}
              onLoadMore={handleLoadMore}
              autoScroll={autoScroll}
            />
          )}

          <ChatInput
            onSend={handleSendMessage}
            onStop={handleStopGeneration}
            isGenerating={isGenerating}
            disabled={modelState !== "ready" && modelState !== "generating"}
            enableSTT={settings.enableSTT}
          />
        </div>

        <Suspense fallback={null}>
          <SettingsPanel
            open={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            settings={settings}
            onSave={handleSaveSettings}
          />
        </Suspense>

        <Suspense fallback={null}>
          <ExportDialog
            open={exportDialogOpen}
            onClose={() => {
              setExportDialogOpen(false);
              setExportingSessionId(null);
            }}
            onExport={handleExportChat}
            chatTitle={
              exportingSessionId 
                ? sessions.find(s => s.id === exportingSessionId)?.title || "Chat"
                : "Chat"
            }
          />
        </Suspense>
      </div>
    </SidebarProvider>
  );
}
