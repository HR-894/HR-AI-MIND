import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { useAppStore } from "@/store/appStore";

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
