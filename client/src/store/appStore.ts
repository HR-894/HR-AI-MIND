import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Settings } from "@shared/schema";
import { loadSettings, saveSettings } from "@/lib/settings";

export type ModelState = "idle" | "downloading" | "loading" | "ready" | "error";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export interface AppState {
  currentSessionId: string | null;
  modelState: ModelState;
  modelProgress: number;
  isGenerating: boolean;
  settings: Settings;
  deferredPrompt: BeforeInstallPromptEvent | null;

  setCurrentSessionId: (id: string | null) => void;
  setModelState: (state: ModelState) => void;
  setModelProgress: (p: number) => void;
  setIsGenerating: (v: boolean) => void;
  setSettings: (s: Settings) => void;
  setDeferredPrompt: (e: BeforeInstallPromptEvent | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentSessionId: null,
      modelState: "idle",
      modelProgress: 0,
      isGenerating: false,
      settings: loadSettings(),
      deferredPrompt: null,

      setCurrentSessionId: (id: string | null) => set({ currentSessionId: id }),
      setModelState: (state: ModelState) => set({ modelState: state }),
      setModelProgress: (p: number) => set({ modelProgress: p }),
      setIsGenerating: (v: boolean) => set({ isGenerating: v }),
      setSettings: (s: Settings) => {
        saveSettings(s);
        set({ settings: s });
      },
      setDeferredPrompt: (e: BeforeInstallPromptEvent | null) => set({ deferredPrompt: e }),
    }),
    {
      name: "hrai-app-store",
      // Persist settings and current session selection to survive reloads
      partialize: (state: AppState) => ({ settings: state.settings, currentSessionId: state.currentSessionId }),
    }
  )
);

export const selectors = {
  currentSessionId: (s: AppState) => s.currentSessionId,
  modelState: (s: AppState) => s.modelState,
  modelProgress: (s: AppState) => s.modelProgress,
  isGenerating: (s: AppState) => s.isGenerating,
  settings: (s: AppState) => s.settings,
  deferredPrompt: (s: AppState) => s.deferredPrompt,
};
