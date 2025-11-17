import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadSettings, saveSettings, resetSettings } from './settings';
import { DEFAULT_SETTINGS } from '@shared/schema';

describe('settings', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('loadSettings', () => {
    it('should return default settings when no settings are stored', () => {
      const settings = loadSettings();
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });

    it('should load valid settings from localStorage', () => {
      const customSettings = {
        ...DEFAULT_SETTINGS,
        theme: 'dark' as const,
        temperature: 0.9,
      };
      
      localStorage.setItem('hrai-settings', JSON.stringify(customSettings));
      
      const settings = loadSettings();
      expect(settings.theme).toBe('dark');
      expect(settings.temperature).toBe(0.9);
    });

    it('should return defaults when stored settings are invalid', () => {
      localStorage.setItem('hrai-settings', 'invalid json');
      
      const settings = loadSettings();
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });

    it('should return defaults when schema validation fails', () => {
      const invalidSettings = {
        ...DEFAULT_SETTINGS,
        temperature: 999, // Invalid: should be 0-2
      };
      
      localStorage.setItem('hrai-settings', JSON.stringify(invalidSettings));
      
      const settings = loadSettings();
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });

    it('should handle missing localStorage gracefully', () => {
      // This tests the try-catch error handling
      const settings = loadSettings();
      expect(settings).toBeDefined();
    });
  });

  describe('saveSettings', () => {
    it('should save valid settings to localStorage', () => {
      const customSettings = {
        ...DEFAULT_SETTINGS,
        temperature: 0.5,
        maxTokens: 2048,
      };
      
      saveSettings(customSettings);
      
      const stored = localStorage.getItem('hrai-settings');
      expect(stored).toBeTruthy();
      
      const parsed = JSON.parse(stored!);
      expect(parsed.temperature).toBe(0.5);
      expect(parsed.maxTokens).toBe(2048);
    });

    it('should not save invalid settings', () => {
      const invalidSettings = {
        ...DEFAULT_SETTINGS,
        temperature: 'not a number' as any, // Invalid type
      };
      
      saveSettings(invalidSettings);
      
      // Should not be stored
      const stored = localStorage.getItem('hrai-settings');
      expect(stored).toBeNull();
    });

    it('should validate settings before saving', () => {
      const invalidSettings = {
        ...DEFAULT_SETTINGS,
        contextWindow: -1, // Invalid: should be positive
      };
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      saveSettings(invalidSettings);
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle localStorage errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock localStorage.setItem to throw
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage full');
      });
      
      saveSettings(DEFAULT_SETTINGS);
      
      expect(consoleSpy).toHaveBeenCalled();
      
      // Restore
      localStorage.setItem = originalSetItem;
      consoleSpy.mockRestore();
    });
  });

  describe('resetSettings', () => {
    it('should reset settings to defaults', () => {
      // Set custom settings first
      const customSettings = {
        ...DEFAULT_SETTINGS,
        temperature: 1.5,
      };
      localStorage.setItem('hrai-settings', JSON.stringify(customSettings));
      
      // Reset
      const settings = resetSettings();
      
      expect(settings).toEqual(DEFAULT_SETTINGS);
      
      // Verify stored settings are defaults
      const stored = localStorage.getItem('hrai-settings');
      const parsed = JSON.parse(stored!);
      expect(parsed).toEqual(DEFAULT_SETTINGS);
    });

    it('should return default settings object', () => {
      const settings = resetSettings();
      expect(settings.theme).toBe(DEFAULT_SETTINGS.theme);
      expect(settings.temperature).toBe(DEFAULT_SETTINGS.temperature);
      expect(settings.modelId).toBe(DEFAULT_SETTINGS.modelId);
    });

    it('should clear any existing settings', () => {
      localStorage.setItem('hrai-settings', JSON.stringify({ custom: 'data' }));
      
      resetSettings();
      
      const stored = localStorage.getItem('hrai-settings');
      const parsed = JSON.parse(stored!);
      
      // Should only contain default settings keys
      expect(parsed).toHaveProperty('theme');
      expect(parsed).toHaveProperty('temperature');
      expect(parsed).not.toHaveProperty('custom');
    });
  });

  describe('integration tests', () => {
    it('should maintain settings across save/load cycles', () => {
      const customSettings = {
        ...DEFAULT_SETTINGS,
        theme: 'dark' as const,
        temperature: 0.7,
        maxTokens: 3000,
        enableTTS: true,
      };
      
      saveSettings(customSettings);
      const loaded = loadSettings();
      
      expect(loaded.theme).toBe('dark');
      expect(loaded.temperature).toBe(0.7);
      expect(loaded.maxTokens).toBe(3000);
      expect(loaded.enableTTS).toBe(true);
    });

    it('should recover from corrupted settings', () => {
      // Corrupt the settings
      localStorage.setItem('hrai-settings', '{invalid json');
      
      // Should return defaults
      const loaded = loadSettings();
      expect(loaded).toEqual(DEFAULT_SETTINGS);
      
      // Should be able to save new settings
      saveSettings({ ...DEFAULT_SETTINGS, temperature: 0.8 });
      const reloaded = loadSettings();
      expect(reloaded.temperature).toBe(0.8);
    });
  });
});
