import { test as base } from '@playwright/test';

// Extend base test with WebGPU mock and AI worker mocking
export const test = base.extend({
  page: async ({ page }, use) => {
    // Mock WebGPU support
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'gpu', {
        value: {},
        writable: false,
        configurable: true,
      });
      
      // Enable test mode flag
      (window as any).__E2E_TEST_MODE__ = true;
      
      // Mock AI Worker to bypass actual model loading
      const OriginalWorker = Worker;
      (window as any).Worker = class MockWorker extends EventTarget {
        constructor(url: string | URL) {
          super();
          // Simulate worker ready state immediately
          setTimeout(() => {
            this.dispatchEvent(new MessageEvent('message', {
              data: { type: 'ready', model: 'test-model' }
            }));
          }, 100);
        }
        
        postMessage(data: any) {
          // Mock worker responses
          setTimeout(() => {
            if (data.type === 'generate') {
              // Simulate a response
              this.dispatchEvent(new MessageEvent('message', {
                data: { type: 'chunk', content: 'This is a test response.' }
              }));
              this.dispatchEvent(new MessageEvent('message', {
                data: { type: 'done' }
              }));
            }
          }, 50);
        }
        
        terminate() {}
      };
      
      // Mock localStorage for settings
      const originalSetItem = Storage.prototype.setItem;
      const originalGetItem = Storage.prototype.getItem;
      
      const mockStorage: Record<string, string> = {
        'hrai-settings': JSON.stringify({
          selectedModel: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
          theme: 'light',
          autoScroll: true,
          showTimestamps: false,
        }),
        'downloaded-models': JSON.stringify(['Llama-3.2-1B-Instruct-q4f16_1-MLC']),
      };
      
      Storage.prototype.getItem = function(key: string) {
        if (key in mockStorage) {
          return mockStorage[key];
        }
        return originalGetItem.call(this, key);
      };
      
      Storage.prototype.setItem = function(key: string, value: string) {
        mockStorage[key] = value;
        return originalSetItem.call(this, key, value);
      };
    });
    
    await use(page);
  },
});

export { expect } from '@playwright/test';
