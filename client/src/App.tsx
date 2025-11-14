import { lazy, Suspense, useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { useAppStore, selectors } from "@/store/appStore";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { NetworkStatus } from "@/components/NetworkStatus";
import { HomePage } from "@/pages/HomePage";
import { AlertCircle, Chrome } from "lucide-react";
import { Button } from "@/components/ui/button";

// Lazy load chat page for code splitting
const ChatPage = lazy(() => import("@/pages/ChatPage"));

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center space-y-4">
        <div className="relative w-16 h-16 mx-auto">
          <div className="absolute inset-0 border-4 border-blue-200 dark:border-blue-900 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
        </div>
        <div className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Loading HRAI Mind
        </div>
      </div>
    </div>
  );
}

// WebGPU feature detection
function detectWebGPU(): boolean {
  if (typeof navigator === 'undefined') return false;
  return !!(navigator as any).gpu;
}

// WebGPU not supported fallback
function WebGPUNotSupported() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 p-4">
      <div className="max-w-2xl w-full bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-8 md:p-12">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              WebGPU Not Supported
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              Your browser doesn't support WebGPU
            </p>
          </div>

          <div className="space-y-4 w-full max-w-md text-left bg-slate-50 dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <p className="text-slate-700 dark:text-slate-300">
              This application requires <strong>WebGPU</strong> to run AI models directly in your browser.
            </p>
            
            <div className="space-y-2">
              <p className="font-semibold text-slate-800 dark:text-slate-200">Recommended browsers:</p>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2">
                  <Chrome className="w-4 h-4" />
                  <span>Google Chrome or Chromium (version 121+)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Chrome className="w-4 h-4" />
                  <span>Microsoft Edge (version 121+)</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                <strong>Note:</strong> Firefox and Safari currently have limited WebGPU support. Please use a Chromium-based browser for the best experience.
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" asChild>
              <a href="https://www.google.com/chrome/" target="_blank" rel="noopener noreferrer">
                Download Chrome
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="https://www.microsoft.com/edge" target="_blank" rel="noopener noreferrer">
                Download Edge
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const settings = useAppStore(selectors.settings);
  const { toast } = useToast();

  useEffect(() => {
    setIsSupported(detectWebGPU());
  }, []);

  // PWA update notification
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });

      navigator.serviceWorker.getRegistration().then((reg) => {
        if (!reg) return;

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                toast({
                  title: "New update available!",
                  description: "Click to refresh and get the latest version.",
                  action: (
                    <button
                      className="ml-2 px-3 py-1 rounded bg-indigo-600 text-white text-xs hover:bg-indigo-700"
                      onClick={() => {
                        reg.waiting?.postMessage({ type: 'SKIP_WAITING' });
                        window.location.reload();
                      }}
                    >
                      Update Now
                    </button>
                  ),
                });
              }
            });
          }
        });
      });
    }
  }, [toast]);

  // Proactive prefetch for faster navigation and better offline readiness
  useEffect(() => {
    // Skip in SSR-like environments
    if (typeof window === 'undefined') return;

    const idle = (cb: () => void) =>
      (window as any).requestIdleCallback ? (window as any).requestIdleCallback(cb, { timeout: 2000 }) : setTimeout(cb, 1500);

    idle(() => {
      // Prefetch ChatPage chunk
      import("@/pages/ChatPage").catch(() => {});

      // Warm the models.json request so it's available offline quickly
      fetch("/models.json", { cache: "no-cache" }).catch(() => {});

      // Prefetch heavy but common UI chunks so they work offline
      import("@/components/SettingsPanel").catch(() => {});
      import("@/components/ExportDialog").catch(() => {});
    });

    // Also prefetch shortly after first paint
    const t = setTimeout(() => {
      import("@/pages/ChatPage").catch(() => {});
    }, 3000);
    return () => clearTimeout(t);
  }, []);

  // Show loading while checking
  if (isSupported === null) {
    return <PageLoader />;
  }

  // Show fallback if not supported
  if (!isSupported) {
    return <WebGPUNotSupported />;
  }

  // Render app if supported
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ErrorBoundary>
          <Switch>
            {/* Home page route */}
            <Route path="/" component={HomePage} />
            
            {/* Chat page route with lazy loading */}
            <Route path="/chat">
              <Suspense fallback={<PageLoader />}>
                <ChatPage />
              </Suspense>
            </Route>
            
            {/* 404 Not Found fallback */}
            <Route>
              <div className="flex items-center justify-center h-screen">
                <div className="text-center space-y-4">
                  <h1 className="text-4xl font-bold">404</h1>
                  <p className="text-gray-600">Page not found</p>
                  <a href="/" className="text-blue-600 hover:underline">
                    Go back home
                  </a>
                </div>
              </div>
            </Route>
          </Switch>
          
          <PWAInstallPrompt />
          <NetworkStatus />
        </ErrorBoundary>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
