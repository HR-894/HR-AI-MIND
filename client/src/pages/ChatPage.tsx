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
import { speak, stopSpeaking, isTTSSupported, isSTTSupported } from "@/lib/speech";
import { useChatSessions } from "@/hooks/useChatSessions";
import { useAIWorker } from "@/hooks/useAIWorker";
import { useAppStore, selectors, type AppState } from "@/store/appStore";
import { type UploadedFile } from "@/components/FileUpload";
import { 
  getRecommendedModelForFiles, 
  doesModelSupportFiles, 
  getModelMismatchMessage 
} from "@/lib/model-capabilities";

// Lazy load heavy components (deferred mount)
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
  const [showBg, setShowBg] = useState(false);
  
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
    // Mark as manually renamed so auto-title generation doesn't override it
    await db.chatSessions.update(id, { isManuallyRenamed: true });
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

  const handleSendMessage = useCallback(async (content: string, files?: UploadedFile[]) => {
    // Auto-switch model if files require multimodal capabilities
    if (files && files.length > 0) {
      const recommended = getRecommendedModelForFiles(files);
      const currentModelSupports = doesModelSupportFiles(settings.modelId, files);
      
      if (recommended && !currentModelSupports) {
        toast({
          title: "Switching to Vision Model",
          description: "Your files require Phi-3.5 Vision for analysis. Switching automatically...",
        });
        
        // Update settings with recommended model
        setSettings({ ...settings, modelId: recommended });
        
        // Initialize the new model if not already loaded
        if (modelState === "idle" || settings.modelId !== recommended) {
          await initModel(recommended);
        }
      } else if (!currentModelSupports) {
        // Show warning if files can't be processed
        const mismatchMessage = getModelMismatchMessage(settings.modelId, files);
        toast({
          title: "Model Incompatible",
          description: mismatchMessage,
          variant: "destructive",
        });
        return; // Don't send message
      }
    }
    
    let sessionId = currentSessionId;
    
    // Create new session if none exists
    if (!sessionId) {
      sessionId = await createSession();
      setCurrentSessionId(sessionId);
    }

    // Get current session to check if it's been manually renamed
    const session = await db.chatSessions.get(sessionId);
    
    // Auto-generate title from first message only if:
    // 1. This is the first message (check message count)
    // 2. The session hasn't been manually renamed
    const messageCount = await db.chatMessages.where("sessionId").equals(sessionId).count();
    
    if (messageCount === 0 && session && !session.isManuallyRenamed) {
      // Generate a smart title from the first message
      const title = content.substring(0, 30) + (content.length > 30 ? "..." : "");
      await db.chatSessions.update(sessionId, { title, updatedAt: Date.now() });
    }

    // Format content for multimodal if files are present
    let messageContent = content;
    if (files && files.length > 0) {
      // For now, just append file info to content
      // Future: Format as proper multimodal message with base64 images
      const fileInfo = files.map(f => `[Attached: ${f.file.name}]`).join(" ");
      messageContent = `${content}\n\n${fileInfo}`;
    }

    // Add user message to database FIRST (so it's in the history)
    const userMessageId = crypto.randomUUID();
    await db.chatMessages.add({
      id: userMessageId,
      sessionId,
      role: "user",
      content: messageContent,
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
  }, [currentSessionId, createSession, setCurrentSessionId, messages, settings, generate, modelState, initModel, setSettings, toast]);

  const handleStopGeneration = useCallback(() => {
    abort();
    // Stop any ongoing TTS when stopping generation
    if (settings.enableTTS) {
      stopSpeaking();
    }
  }, [abort, settings.enableTTS]);

  const handleSaveSettings = useCallback((newSettings: typeof settings) => {
    setSettings(newSettings);
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated",
    });
  }, [setSettings, toast]);

  // Auto-load model when chat opens (ONLY IF ALREADY CACHED - NO AUTO-DOWNLOAD)
  useEffect(() => {
    const initializeModel = async () => {
      // Dynamically import with offline-safe fallback
      let isModelCached: ((id: string) => Promise<boolean>) | null = null;
      try {
        ({ isModelCached } = await import("@/lib/model-utils"));
      } catch (e) {
        console.warn('[ChatPage] model-utils import failed (possibly offline). Trying direct cache check...');
        // Even if import fails offline, try to check cache directly
        try {
          const dbName = `webllm/model/${settings.modelId}`;
          const databases = await indexedDB.databases();
          const hasModel = databases.some(db => db.name === dbName);
          
          if (hasModel && modelState === "idle") {
            console.log('[ChatPage] Model found in IndexedDB (offline mode), starting auto-load from cache');
            initModel(settings.modelId);
          }
        } catch (err) {
          console.warn('[ChatPage] Direct cache check also failed:', err);
        }
        return;
      }
      
      const isCached = isModelCached ? await isModelCached(settings.modelId) : false;

      if (isCached && modelState === "idle") {
        console.log('[ChatPage] Model is cached, starting auto-load from cache (NO download)');
        initModel(settings.modelId);
      } else if (!isCached && modelState === "idle") {
        console.log('[ChatPage] Model NOT cached. User must explicitly download via "Download Model" button.');
      }
    };

    initializeModel();
  }, [settings.modelId, modelState, initModel]);

  // One-time silent warmup after chat opens (ONLY if model is fully cached)
  // This pre-compiles the model for faster first generation
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const idle = (cb: () => void) =>
      (window as any).requestIdleCallback ? (window as any).requestIdleCallback(cb, { timeout: 2000 }) : setTimeout(cb, 1500);

    idle(() => {
      // Warmup ONLY runs if model is already cached (verified inside warmupModelOnce)
      // Will NOT trigger any download - cache-only operation
      import("@/lib/warmup").then(mod => {
        mod.warmupModelOnce(settings.modelId).catch(() => {});
      }).catch(() => {});
    });
  }, [settings.modelId]);

  // Defer background render until model starts loading/ready or messages exist
  useEffect(() => {
    if (modelState !== "idle" || messages.length > 0) {
      setShowBg(true);
    }
  }, [modelState, messages.length]);

  // TTS: Speak assistant responses when they complete (not while generating)
  useEffect(() => {
    if (!settings.enableTTS || !isTTSSupported() || isGenerating) return;
    
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === "assistant" && lastMessage.content) {
      // Speak the completed assistant message
      speak(lastMessage.content);
    }
  }, [messages, isGenerating, settings.enableTTS]);

  // Auto-hide header on scroll, show on hover or scroll up
  useEffect(() => {
    // In E2E tests, keep headers always visible for stable selectors
    if ((window as any).__E2E_TEST_MODE__) {
      setShowHeader(true);
      return;
    }

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

  // Don't auto-create sessions on load - let users explicitly create or wait for first message
  // This prevents blank "New Chat" sessions from being created on every page refresh
  useEffect(() => {
    // If there are sessions but no current session selected, select the most recent one
    if (sessions.length > 0 && !currentSessionId) {
      const mostRecentSession = sessions[0]; // Already sorted by updatedAt descending
      if (mostRecentSession) {
        setCurrentSessionId(mostRecentSession.id);
      }
    }
    // Note: We deliberately DON'T create a session if none exist
    // Sessions are created when user clicks "New Chat" or sends first message
  }, [sessions, currentSessionId, setCurrentSessionId]);

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
      {showBg && (
        <Suspense fallback={null}>
          <ChatBackground />
        </Suspense>
      )}
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

        <div className="flex flex-col h-screen w-full flex-1 min-w-0 relative">
          {/* Show draggable PiP when model is loading or downloading */}
          {(modelState === "loading" || modelState === "downloading") && (
            <ModelLoadingOverlay 
              progress={modelProgress} 
              modelName={settings.modelId}
            />
          )}

          {/* App Title Header - AUTO-HIDE with matching background */}
          <div 
            ref={headerRef}
            className={`shrink-0 border-b border-indigo-200/30 dark:border-indigo-700/40 bg-gradient-to-br from-indigo-50/60 via-purple-50/40 to-pink-50/60 dark:from-slate-900/90 dark:via-indigo-900/60 dark:to-purple-900/50 backdrop-blur-xl transition-all duration-300 ease-in-out shadow-sm ${
              showHeader ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 h-0 overflow-hidden'
            }`}
          >
            <div className="px-3 py-2 flex justify-center">
              <div className="inline-flex items-center justify-center px-5 py-2 rounded-2xl bg-gradient-to-r from-white/70 to-indigo-50/70 dark:from-slate-700/80 dark:to-indigo-800/80 backdrop-blur-2xl border border-indigo-300/40 dark:border-indigo-600/60 shadow-lg hover:shadow-xl transition-all duration-300">
                <h1 className="text-xl font-black tracking-wider">
                  <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent drop-shadow-sm">
                    H R
                  </span>
                  <span className="mx-2 text-indigo-300 dark:text-indigo-500">•</span>
                  <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 dark:from-purple-400 dark:via-pink-400 dark:to-rose-400 bg-clip-text text-transparent drop-shadow-sm">
                    A I
                  </span>
                  <span className="mx-2 text-indigo-300 dark:text-indigo-500">•</span>
                  <span className="bg-gradient-to-r from-pink-600 via-violet-600 to-blue-600 dark:from-pink-400 dark:via-violet-400 dark:to-blue-400 bg-clip-text text-transparent drop-shadow-sm">
                    M I N D
                  </span>
                </h1>
              </div>
            </div>
            
            {/* Navigation Tabs */}
            <div className="flex items-center justify-center px-3 pb-2.5 pt-1">
              <Tabs defaultValue="chat" className="w-full max-w-md">
                <TabsList className="grid w-full grid-cols-2 bg-white/70 dark:bg-slate-800/90 backdrop-blur-lg border border-indigo-200/60 dark:border-indigo-600/60 shadow-md p-1 rounded-xl">
                  <TabsTrigger 
                    value="home" 
                    onClick={() => setLocation("/")}
                    className="relative text-sm py-2 px-4 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-400 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-emerald-50 dark:hover:bg-emerald-800/50 transition-all duration-300 data-[state=inactive]:text-gray-600 dark:data-[state=inactive]:text-gray-300 rounded-lg font-medium"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Home
                  </TabsTrigger>
                  <TabsTrigger 
                    value="chat"
                    className="relative text-sm py-2 px-4 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:via-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-blue-50 dark:hover:bg-blue-800/50 transition-all duration-300 data-[state=inactive]:text-gray-600 dark:data-[state=inactive]:text-gray-300 rounded-lg font-medium"
                  >
                    Chat
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Content Area with Free-Floating Overlay Buttons */}
          <div className="flex-1 flex flex-col relative overflow-hidden">
            
            {/* Left Overlay: Sidebar Toggle + Session Title - Free floating */}
            <div className="absolute top-3 left-4 z-10">
              <div className="relative">
                <div className="absolute inset-0 p-[1px] rounded-xl bg-gradient-to-r from-indigo-500/40 via-purple-500/40 to-pink-500/40 blur-sm"></div>
                <div className="absolute inset-0 p-[1px] rounded-xl bg-gradient-to-r from-indigo-500/70 via-purple-500/70 to-pink-500/70"></div>
                
                <div className="relative h-10 flex items-center gap-2 px-3 bg-white/90 dark:bg-slate-700/95 backdrop-blur-2xl rounded-xl shadow-lg border border-white/20 dark:border-indigo-400/20">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                  <h2 className="text-xs font-semibold truncate bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-300 dark:to-purple-300 bg-clip-text text-transparent max-w-[180px]">
                    {currentSession?.title || "New Conversation"}
                  </h2>
                </div>
              </div>
            </div>

            {/* Right Overlay: Model Dropdown + Status + Settings - Free floating */}
            <div className="absolute top-3 right-4 z-10">
              <div className="relative">
                <div className="absolute inset-0 p-[1px] rounded-xl bg-gradient-to-r from-pink-500/40 via-purple-500/40 to-indigo-500/40 blur-sm"></div>
                <div className="absolute inset-0 p-[1px] rounded-xl bg-gradient-to-r from-pink-500/70 via-purple-500/70 to-indigo-500/70"></div>
                
                <div className="relative h-10 flex items-center gap-2 px-3 bg-white/90 dark:bg-slate-700/95 backdrop-blur-2xl rounded-xl shadow-lg border border-white/20 dark:border-indigo-400/20">
                  <ModelDownloadManager 
                    currentModelId={settings.modelId}
                    onModelChange={(modelId) => {
                      setSettings({ ...settings, modelId });
                    }}
                    onDownloadStateChange={(state) => {
                      if (state === "downloading") {
                        console.log('[ChatPage] Download started from header');
                      }
                    }}
                  />
                  
                  <ModelStatus />
                  
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setSettingsOpen(true)}
                    className="h-7 w-7 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors duration-200"
                    data-testid="settings-button"
                    aria-label="Settings"
                  >
                    <SettingsIcon className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Scrollable Messages Area - Full height, scrolls under overlay buttons */}
            <div className="flex-1 overflow-hidden relative pt-14">
            {/* Show message when no model is ready and not downloading */}
            {modelState !== "ready" && !isGenerating && modelState !== "downloading" && messages.length === 0 && (
              <div className="h-full flex items-center justify-center p-8" data-testid="message-list">
                <div className="max-w-md text-center space-y-6">
                  <div className="relative w-24 h-24 mx-auto">
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-3xl blur-2xl opacity-40 animate-pulse"></div>
                    {/* Icon container */}
                    <div className="relative w-full h-full rounded-3xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 backdrop-blur-sm flex items-center justify-center border border-indigo-200/50 dark:border-indigo-700/50 shadow-lg">
                      <Download className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                      No AI Model Downloaded
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      Please download an AI model first using the dropdown above to start chatting.
                    </p>
                  </div>
                  <div className="pt-4">
                    <ModelDownloadManager 
                      currentModelId={settings.modelId}
                      onModelChange={(modelId) => {
                        setSettings({ ...settings, modelId });
                      }}
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

            {/* Fixed Input Area - Optimized Size */}
            <div className="shrink-0 px-3 py-2.5 bg-white/60 dark:bg-slate-800/80 backdrop-blur-sm border-t border-indigo-200/30 dark:border-indigo-700/40">
              {/* Glassmorphism container with enhanced visual appeal */}
              <div className="relative rounded-lg overflow-hidden shadow-lg max-w-3xl mx-auto">
                {/* Animated gradient border */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 opacity-40 dark:opacity-60 blur-sm"></div>
                
                {/* Main input container with glassmorphism */}
                <div className="relative bg-white/90 dark:bg-slate-800/95 backdrop-blur-2xl border border-indigo-200/60 dark:border-indigo-600/70 rounded-lg">
                  {/* Top glow accent */}
                  <div className="absolute -top-px left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-indigo-400 dark:via-indigo-300 to-transparent"></div>
                  
                  <ChatInput
                    onSend={handleSendMessage}
                    onStop={handleStopGeneration}
                    isGenerating={isGenerating}
                    disabled={modelState !== "ready" && !isGenerating}
                    enableSTT={settings.enableSTT}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {settingsOpen && (
          <Suspense fallback={null}>
            <SettingsPanel
              open={settingsOpen}
              onClose={() => setSettingsOpen(false)}
              settings={settings}
              onSave={handleSaveSettings}
            />
          </Suspense>
        )}

        {exportDialogOpen && (
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
        )}
      </div>
    </SidebarProvider>
  );
}
