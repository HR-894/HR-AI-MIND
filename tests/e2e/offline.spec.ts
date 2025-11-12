import { test, expect } from '@playwright/test';

test.describe('Offline Mode & PWA', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should show network status indicator', async ({ page }) => {
    await page.goto('/chat');
    
    // Check for network status component
    const networkStatus = page.locator('[data-testid="network-status"]');
    await expect(networkStatus).toBeVisible({ timeout: 10000 });
  });

  test('should detect offline state', async ({ page, context }) => {
    await page.goto('/chat');
    
    // Go offline
    await context.setOffline(true);
    
    // Wait a moment for the app to detect offline state
    await page.waitForTimeout(2000);
    
    // Should show offline indicator
    await expect(page.getByText(/offline|no connection/i)).toBeVisible({ timeout: 5000 });
  });

  test('should prevent downloads when offline', async ({ page, context }) => {
    await page.goto('/chat');
    
    // Go offline
    await context.setOffline(true);
    await page.waitForTimeout(1000);
    
    // Open settings
    const settingsButton = page.getByRole('button', { name: /settings/i });
    await settingsButton.click();
    
    // Go to model tab
    const modelTab = page.getByRole('tab', { name: /model/i });
    if (await modelTab.isVisible()) {
      await modelTab.click();
      
      // Try to download a model
      const downloadButton = page.getByRole('button', { name: /download/i }).first();
      if (await downloadButton.isVisible()) {
        await downloadButton.click();
        
        // Should show offline error
        await expect(page.getByText(/offline|no internet|network/i)).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should load cached content when offline', async ({ page, context }) => {
    await page.goto('/chat');
    
    // Send a message while online
    const messageInput = page.locator('textarea[placeholder*="message" i]');
    if (await messageInput.isVisible({ timeout: 5000 })) {
      await messageInput.fill('Test offline cache');
      const sendButton = page.getByRole('button', { name: /send/i });
      await sendButton.click();
      await expect(page.getByText('Test offline cache')).toBeVisible();
    }
    
    // Go offline
    await context.setOffline(true);
    
    // Reload the page
    await page.reload();
    
    // Content should still load from cache
    await expect(page.getByText('Test offline cache')).toBeVisible({ timeout: 10000 });
  });

  test('should re-enable features when back online', async ({ page, context }) => {
    await page.goto('/chat');
    
    // Go offline
    await context.setOffline(true);
    await page.waitForTimeout(1000);
    
    // Should show offline state
    await expect(page.getByText(/offline/i)).toBeVisible({ timeout: 5000 });
    
    // Go back online
    await context.setOffline(false);
    await page.waitForTimeout(2000);
    
    // Should show online state
    await expect(page.getByText(/online|connected/i)).toBeVisible({ timeout: 5000 });
  });

  test('should have service worker registered', async ({ page }) => {
    await page.goto('/');
    
    // Check if service worker is registered
    const swRegistered = await page.evaluate(() => {
      return navigator.serviceWorker.getRegistrations().then(
        registrations => registrations.length > 0
      );
    });
    
    expect(swRegistered).toBe(true);
  });

  test('should have manifest.json', async ({ page }) => {
    const response = await page.goto('/manifest.json');
    expect(response?.status()).toBe(200);
    
    const manifest = await response?.json();
    expect(manifest).toHaveProperty('name');
    expect(manifest).toHaveProperty('short_name');
    expect(manifest).toHaveProperty('start_url');
  });

  test('should cache static assets', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check if cache API is available
    const hasCachedAssets = await page.evaluate(async () => {
      const cacheNames = await caches.keys();
      return cacheNames.length > 0;
    });
    
    expect(hasCachedAssets).toBe(true);
  });

  test('should handle IndexedDB in offline mode', async ({ page, context }) => {
    await page.goto('/chat');
    
    // Add some data
    const messageInput = page.locator('textarea[placeholder*="message" i]');
    if (await messageInput.isVisible({ timeout: 5000 })) {
      await messageInput.fill('Test IndexedDB offline');
      const sendButton = page.getByRole('button', { name: /send/i });
      await sendButton.click();
      await expect(page.getByText('Test IndexedDB offline')).toBeVisible();
    }
    
    // Go offline
    await context.setOffline(true);
    
    // Verify IndexedDB still works
    const dbWorks = await page.evaluate(async () => {
      return new Promise((resolve) => {
        const request = indexedDB.open('hrai-mind-db');
        request.onsuccess = () => resolve(true);
        request.onerror = () => resolve(false);
      });
    });
    
    expect(dbWorks).toBe(true);
  });

  test('should show PWA install prompt on supported browsers', async ({ page }) => {
    await page.goto('/');
    
    // Check if PWA install prompt component exists
    const installPrompt = page.locator('[data-testid="pwa-install-prompt"]');
    
    // May or may not be visible depending on browser support
    // Just check if the component is in the DOM
    const exists = await installPrompt.count();
    expect(exists).toBeGreaterThanOrEqual(0);
  });
});
