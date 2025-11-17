import { settingsSchema, DEFAULT_SETTINGS, type Settings } from "@shared/schema";

const SETTINGS_KEY = "hrai-settings";

export function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) return DEFAULT_SETTINGS;
    
    const parsed = JSON.parse(stored);
    const result = settingsSchema.safeParse(parsed);
    
    if (!result.success) {
      console.warn("Settings validation failed, using defaults:", result.error);
      return DEFAULT_SETTINGS;
    }
    
    return result.data;
  } catch {
    // Return default settings if parse fails
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  try {
    const result = settingsSchema.safeParse(settings);
    if (!result.success) {
      // Only log in development mode
      if (import.meta.env.DEV) {
        console.warn("Invalid settings:", result.error);
      }
      return;
    }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(result.data));
  } catch (error) {
    // Only log in development mode
    if (import.meta.env.DEV) {
      console.error("Failed to save settings:", error);
    }
  }
}

export function resetSettings(): Settings {
  try {
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
    return DEFAULT_SETTINGS;
  } catch {
    // If localStorage fails, return defaults without saving
    return DEFAULT_SETTINGS;
  }
}
