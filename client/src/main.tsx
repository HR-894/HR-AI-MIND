import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { inject } from '@vercel/analytics';
import App from "./App";
import "./index.css";
import { useAppStore } from "@/store/appStore";

// Initialize Vercel Web Analytics
inject();

// Register service worker for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js', { scope: '/' })
      .then(registration => {
        console.log('[SW] Service Worker registered successfully:', registration.scope);
        
        // Check for updates every hour
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
        
        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[SW] New service worker available, will activate on next reload');
              }
            });
          }
        });
      })
      .catch(error => {
        console.error('[SW] Service Worker registration failed:', error);
      });
  });
}

// Capture the beforeinstallprompt event ASAP, before React even mounts
// This ensures we don't miss it due to component lifecycle delays
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

window.addEventListener("beforeinstallprompt", (e: Event) => {
  e.preventDefault();
  // Store the event in Zustand so components can access it instantly
  useAppStore.getState().setDeferredPrompt(e as BeforeInstallPromptEvent);
});

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
