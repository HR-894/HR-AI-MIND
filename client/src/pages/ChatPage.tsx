import { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import { useLocation } from "wouter";
import { Settings as SettingsIcon, Home, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MessageList } from "@/components/MessageList";
import { ChatInput } from "@/components/ChatInput";
import { ModelStatus } from "@/components/ModelStatus";
import { ModelLoadingOverlay } from "@/components/ModelLoadingOverlay";
import { ModelDownloadManager } from "@/components/ModelDownloadManager";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/db";
import { useTheme } from "@/lib/theme";
import { speak, isTTSSupported, isSTTSupported } from "@/lib/speech";
import { useChatSessions } from "@/hooks/useChatSessions";
import { useAIWorker } from "@/hooks/useAIWorker";
import { useAppStore, selectors, type AppState } from "@/store/appStore";

// Lazy load heavy components
const SettingsPanel = lazy(() => import("@/components/SettingsPanel").then(m => ({ default: m.SettingsPanel })));
const ExportDialog = lazy(() => import("@/components/ExportDialog").then(m => ({ default: m.ExportDialog })));
const ChatBackground = lazy(() => import("@/components/ChatBackground").then(m => ({ default: m.ChatBackground })));

// Lazy load export function
const exportChat = async (...args: Parameters<typeof import("@/lib/export-chat").exportChat>) => {
  const { exportChat: fn } = await import("@/lib/export-chat");
  return fn(...args);
};

export default function ChatPage() {
  const [, setLocation] = useLocation();
  
  // Use Zustand store for global state
  const settings = useAppStore(selectors.settings);
  const setSettings = useAppStore((s: AppState) => s.setSettings);
  const modelState = useAppStore(selectors.modelState);
  const modelProgress = useAppStore(selectors.modelProgress);
  const setModelState = useAppStore((s: AppState) => s.setModelState);
  const setModelProgress = useAppStore((s: AppState) => s.setModelProgress);
  
  // Use custom hooks for chat sessions and AI worker
  const {
    sessions,
    messages,
    currentSessionId,
    setCurrentSessionId,
    createSession,
    renameSession,
    deleteSession,
  } = useChatSessions();
  
  const { initModel, generate, abort, isGenerating } = useAIWorker();
  
  // Local UI state only
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportingSessionId, setExportingSessionId] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showHeader, setShowHeader] = useState(true);
  
  const hasCreatedInitialSession = useRef(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  
  const { toast } = useToast();
  useTheme(settings.theme);

  const currentSession = sessions.find((s) => s.id === currentSessionId);

  const handleNewSession = useCallback(async () => {
    const id = await createSession();
    setAutoScroll(true);
  }, [createSession]);

  const handleSelectSession = useCallback((id: string) => {
    setCurrentSessionId(id);
    setAutoScroll(true);
  }, [setCurrentSessionId]);

  const handleDeleteSession = useCallback(async (id: string) => {
    await deleteSession(id);
    toast({
      title: "Session deleted",
      description: "Conversation has been removed",
    });
  }, [deleteSession, toast]);

  const handleRenameSession = useCallback(async (id: string, newTitle: string) => {
    await renameSession(id, newTitle);
    toast({
      title: "Session renamed",
      description: `Chat renamed to "${newTitle}"`,
    });
  }, [renameSession, toast]);

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
    
    // Create new session if none exists
    if (!sessionId) {
      sessionId = await createSession();
      setCurrentSessionId(sessionId);
      // Update title with first message
      const title = content.substring(0, 30) + (content.length > 30 ? "..." : "");
      await db.chatSessions.update(sessionId, { title, updatedAt: Date.now() });
    }

    // Add user message to database FIRST (so it's in the history)
    const userMessageId = crypto.randomUUID();
    await db.chatMessages.add({
      id: userMessageId,
      sessionId,
      role: "user",
      content,
      timestamp: Date.now(),
    });
    
    await db.chatSessions.update(sessionId, { updatedAt: Date.now() });
    setAutoScroll(true);

    // Get updated message history including the message we just added
    const updatedMessages = await db.chatMessages
      .where("sessionId")
      .equals(sessionId)
      .sortBy("timestamp");

    // Use the generate hook with updated message history (already includes new user message)
    await generate({
      userContent: "", // Empty because message is already in history
      history: updatedMessages,
      settings,
    });

    // Handle TTS if enabled
    if (settings.enableTTS && isTTSSupported()) {
      // Wait a bit for the response to be generated
      setTimeout(() => {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage?.role === "assistant") {
          speak(lastMessage.content);
        }
      }, 500);
    }
  }, [currentSessionId, createSession, setCurrentSessionId, messages, settings, generate]);

  const handleStopGeneration = useCallback(() => {
    abort();
  }, [abort]);

  const handleSaveSettings = useCallback((newSettings: typeof settings) => {
    setSettings(newSettings);
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated",
    });
  }, [setSettings, toast]);

  // Auto-load model when chat opens (only if already cached)
  useEffect(() => {
    const initializeModel = async () => {
      const { isModelCached } = await import("@/lib/model-utils");
      const isCached = await isModelCached(settings.modelId);
      
      if (isCached && modelState === "idle") {
        console.log('[ChatPage] Model is cached, starting auto-load');
        initModel(settings.modelId);
      }
    };

    initializeModel();
  }, [settings.modelId, modelState, initModel]);

  // Auto-hide header on scroll, show on hover or scroll up
  useEffect(() => {
    let hideTimeout: NodeJS.Timeout;

    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      const currentScrollY = target.scrollTop;

      // Show header when scrolling up or at top
      if (currentScrollY < lastScrollY.current || currentScrollY < 50) {
        setShowHeader(true);
        // Auto-hide after 3 seconds of no interaction
        clearTimeout(hideTimeout);
        hideTimeout = setTimeout(() => {
          if (currentScrollY > 100) {
            setShowHeader(false);
          }
        }, 3000);
      } 
      // Hide header when scrolling down
      else if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        clearTimeout(hideTimeout);
        setShowHeader(false);
      }

      lastScrollY.current = currentScrollY;
    };

    const handleMouseMove = (e: MouseEvent) => {
      // Show header when mouse is near top (within 100px)
      if (e.clientY < 100) {
        setShowHeader(true);
        clearTimeout(hideTimeout);
      }
    };

    // Attach scroll listener to message list
    const messageContainer = document.querySelector('[data-testid="message-list"]')?.firstChild as HTMLElement;
    if (messageContainer) {
      messageContainer.addEventListener('scroll', handleScroll);
    }

    // Attach mouse move listener to window
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      if (messageContainer) {
        messageContainer.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(hideTimeout);
    };
  }, []);

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

        <div className="flex flex-col h-screen w-full flex-1 min-w-0">
          {/* Show draggable PiP when model is loading or downloading */}
          {(modelState === "loading" || modelState === "downloading") && (
            <ModelLoadingOverlay 
              progress={modelProgress} 
              modelName={settings.modelId}
            />
          )}

          {/* App Title Header - AUTO-HIDE */}
          <div 
            ref={headerRef}
            className={`shrink-0 border-b border-border bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 transition-all duration-300 ease-in-out ${
              showHeader ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 h-0 overflow-hidden'
            }`}
          >
            <div className="px-3 py-1.5 flex justify-center">
              <div className="inline-flex items-center justify-center px-4 py-1 rounded-xl bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl border border-white/60 dark:border-gray-700/60 shadow-lg">
                <h1 className="text-lg font-black tracking-wider">
                  <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    H R
                  </span>
                  <span className="mx-1.5 text-gray-400">•</span>
                  <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                    A I
                  </span>
                  <span className="mx-1.5 text-gray-400">•</span>
                  <span className="bg-gradient-to-r from-pink-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                    M I N D
                  </span>
                </h1>
              </div>
            </div>
            
            {/* Navigation Tabs */}
            <div className="flex items-center justify-center px-3 pb-2 pt-1 bg-gradient-to-b from-indigo-50/50 via-purple-50/30 to-transparent dark:from-indigo-950/30 dark:via-purple-950/20 dark:to-transparent backdrop-blur-sm">
              <Tabs defaultValue="chat" className="w-full max-w-md">
                <TabsList className="grid w-full grid-cols-2 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border border-indigo-200/50 dark:border-indigo-700/50 shadow-lg p-0.5">
                  <TabsTrigger 
                    value="home" 
                    onClick={() => setLocation("/")}
                    className="relative text-sm py-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all duration-300 data-[state=inactive]:text-gray-600 dark:data-[state=inactive]:text-gray-400 rounded-md"
                  >
                    <Home className="h-3.5 w-3.5 mr-1.5" />
                    Home
                  </TabsTrigger>
                  <TabsTrigger 
                    value="chat"
                    className="relative text-sm py-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all duration-300 data-[state=inactive]:text-gray-600 dark:data-[state=inactive]:text-gray-400 rounded-md"
                  >
                    Chat
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Chat Header - AUTO-HIDE */}
          <header className={`h-12 border-b border-border flex items-center justify-between px-3 shrink-0 gap-2 bg-background transition-all duration-300 ease-in-out ${
            showHeader ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 h-0 overflow-hidden'
          }`}>
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <h2 className="text-xs font-medium truncate text-muted-foreground">
                {currentSession?.title || "New Conversation"}
              </h2>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <ModelDownloadManager 
                currentModelId={settings.modelId}
                onModelChange={(modelId) => {
                  setSettings({ ...settings, modelId });
                }}
                modelState={modelState}
                onDownloadStateChange={(state) => {
                  if (state === "downloading") {
                    console.log('[ChatPage] Download started from dropdown');
                  }
                }}
              />
              
              <ModelStatus state={modelState} progress={modelProgress} />
              
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setSettingsOpen(true)}
                className="h-8 w-8"
                data-testid="button-settings"
              >
                <SettingsIcon className="h-4 w-4" />
              </Button>
            </div>
          </header>

          {/* Scrollable Messages Area */}
          <div className="flex-1 overflow-hidden">
            {/* Show message when no model is ready and not downloading */}
            {modelState !== "ready" && !isGenerating && modelState !== "downloading" && messages.length === 0 && (
              <div className="h-full flex items-center justify-center p-8">
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
                        setSettings({ ...settings, modelId });
                      }}
                      modelState={modelState}
                      onDownloadStateChange={(state) => {
                        if (state === "downloading") {
                          console.log('[ChatPage] Download started from validation screen');
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {(modelState === "ready" || isGenerating || messages.length > 0) && (
              <MessageList
                messages={messages}
                isGenerating={isGenerating}
                hasMore={false}
                onLoadMore={() => {}}
                autoScroll={autoScroll}
              />
            )}
          </div>

          {/* Fixed Input Area */}
          <div className="shrink-0 border-t border-border bg-background">
            <ChatInput
              onSend={handleSendMessage}
              onStop={handleStopGeneration}
              isGenerating={isGenerating}
              disabled={modelState !== "ready" && !isGenerating}
              enableSTT={settings.enableSTT}
            />
          </div>
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
