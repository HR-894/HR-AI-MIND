import { lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { NetworkStatus } from "@/components/NetworkStatus";
import { HomePage } from "@/pages/HomePage";

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
          Loading HRAI Mind v3...
        </div>
      </div>
    </div>
  );
}

export default function App() {
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
