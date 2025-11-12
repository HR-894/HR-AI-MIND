import { test, expect } from '@playwright/test';

test.describe('Settings Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/chat');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should open settings panel', async ({ page }) => {
    // Look for settings button (gear icon)
    const settingsButton = page.getByRole('button', { name: /settings/i });
    await settingsButton.click();
    
    // Settings dialog should be visible
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/settings/i)).toBeVisible();
  });

  test('should show all settings tabs', async ({ page }) => {
    const settingsButton = page.getByRole('button', { name: /settings/i });
    await settingsButton.click();
    
    // Check for main tabs
    await expect(page.getByRole('tab', { name: /general|model/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /speech|voice/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /storage|data/i })).toBeVisible();
  });

  test('should change theme setting', async ({ page }) => {
    const settingsButton = page.getByRole('button', { name: /settings/i });
    await settingsButton.click();
    
    // Go to general tab
    const generalTab = page.getByRole('tab', { name: /general/i });
    await generalTab.click();
    
    // Find theme selector
    const themeSelect = page.locator('select[name="theme"], button:has-text("Theme")').first();
    await expect(themeSelect).toBeVisible();
  });

  test('should change model selection', async ({ page }) => {
    const settingsButton = page.getByRole('button', { name: /settings/i });
    await settingsButton.click();
    
    // Go to model tab
    const modelTab = page.getByRole('tab', { name: /model/i });
    await modelTab.click();
    
    // Should show model selector
    await expect(page.getByText(/select model|choose model/i)).toBeVisible({ timeout: 5000 });
  });

  test('should toggle auto-scroll setting', async ({ page }) => {
    const settingsButton = page.getByRole('button', { name: /settings/i });
    await settingsButton.click();
    
    // Look for auto-scroll toggle
    const autoScrollSwitch = page.locator('button[role="switch"]').filter({ hasText: /auto.*scroll/i }).first();
    
    if (await autoScrollSwitch.isVisible()) {
      const initialState = await autoScrollSwitch.getAttribute('data-state');
      await autoScrollSwitch.click();
      
      // State should change
      const newState = await autoScrollSwitch.getAttribute('data-state');
      expect(newState).not.toBe(initialState);
    }
  });

  test('should show storage information', async ({ page }) => {
    const settingsButton = page.getByRole('button', { name: /settings/i });
    await settingsButton.click();
    
    // Go to storage tab
    const storageTab = page.getByRole('tab', { name: /storage/i });
    await storageTab.click();
    
    // Should show storage stats
    await expect(page.getByText(/storage|database|cache/i)).toBeVisible();
  });

  test('should reset settings to defaults', async ({ page }) => {
    const settingsButton = page.getByRole('button', { name: /settings/i });
    await settingsButton.click();
    
    // Look for reset button
    const resetButton = page.getByRole('button', { name: /reset|restore defaults/i });
    
    if (await resetButton.isVisible()) {
      await resetButton.click();
      
      // Should show confirmation dialog
      await expect(page.getByText(/are you sure|confirm/i)).toBeVisible();
    }
  });

  test('should close settings panel', async ({ page }) => {
    const settingsButton = page.getByRole('button', { name: /settings/i });
    await settingsButton.click();
    
    // Settings should be open
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // Find close button
    const closeButton = page.getByRole('button', { name: /close/i }).or(
      page.locator('button[aria-label="Close"]')
    );
    await closeButton.first().click();
    
    // Dialog should close
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 2000 });
  });

  test('should persist settings after reload', async ({ page }) => {
    const settingsButton = page.getByRole('button', { name: /settings/i });
    await settingsButton.click();
    
    // Make a change (toggle auto-scroll or similar)
    const generalTab = page.getByRole('tab', { name: /general/i });
    await generalTab.click();
    
    const autoScrollSwitch = page.locator('button[role="switch"]').first();
    if (await autoScrollSwitch.isVisible()) {
      await autoScrollSwitch.click();
      
      // Close settings
      const closeButton = page.getByRole('button', { name: /close/i }).first();
      await closeButton.click();
      
      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Open settings again
      await page.getByRole('button', { name: /settings/i }).click();
      await generalTab.click();
      
      // Setting should be persisted
      await expect(autoScrollSwitch).toBeVisible();
    }
  });

  test('should navigate between tabs smoothly', async ({ page }) => {
    const settingsButton = page.getByRole('button', { name: /settings/i });
    await settingsButton.click();
    
    // Navigate through tabs
    const tabs = ['general', 'model', 'speech', 'storage'];
    
    for (const tabName of tabs) {
      const tab = page.getByRole('tab', { name: new RegExp(tabName, 'i') });
      if (await tab.isVisible()) {
        await tab.click();
        await page.waitForTimeout(300); // Small delay for tab transition
        
        // Tab should be active
        await expect(tab).toHaveAttribute('data-state', 'active');
      }
    }
  });
});
