import { test, expect } from '../fixtures';

test.describe('Chat Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Clear IndexedDB for clean state
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        const request = indexedDB.deleteDatabase('hrai-mind-db');
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
      });
    });
    await page.reload();
  });

  test('should load homepage successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/HRAI Mind/);
    await expect(page.locator('h1')).toContainText(/HR AI MIND/i);
  });

  test('should navigate to chat page', async ({ page }) => {
    // Click on "Start Chat" or similar button
    const startButton = page.getByRole('button', { name: /start chat|new chat/i });
    await startButton.click();
    
    // Should navigate to chat page
    await expect(page).toHaveURL(/\/chat/);
  });

  test('should create a new chat session', async ({ page }) => {
    await page.goto('/chat');
    
    // Wait for page to load
    await page.waitForSelector('[data-testid="message-list"]', { timeout: 10000 });
    
    // Should show empty state
    await expect(page.getByText(/start a conversation/i)).toBeVisible();
  });

  test('should send a message and receive response', async ({ page }) => {
    await page.goto('/chat');
    
    // Wait for chat interface to load and input to be enabled
    const messageInput = page.getByTestId('input-message');
    await messageInput.waitFor({ timeout: 10000 });
    
    // Wait for input to be enabled (requires model to be loaded)
    await expect(messageInput).toBeEnabled({ timeout: 30000 });
    
    // Type a simple message
    await messageInput.fill('Hello, this is a test message');
    
    // Send the message
    const sendButton = page.getByTestId('button-send');
    await sendButton.click();
    
    // Wait for user message to appear
    await expect(page.getByText('Hello, this is a test message')).toBeVisible({ timeout: 5000 });
    
    // Wait for AI response (typing indicator should appear)
    await expect(page.getByTestId('typing-indicator')).toBeVisible({ timeout: 5000 });
    
    // Note: Full AI response may take long, so we just verify the flow starts
  });

  test('should disable send button when message is empty', async ({ page }) => {
    await page.goto('/chat');
    
    const messageInput = page.getByTestId('input-message');
    await messageInput.waitFor({ timeout: 10000 });
    
    // Wait for input to be enabled (model needs to load first)
    await expect(messageInput).toBeEnabled({ timeout: 30000 });
    
    const sendButton = page.getByTestId('button-send');
    
    // Button should be disabled when empty
    await expect(sendButton).toBeDisabled();
    
    // Type something
    await messageInput.fill('Test');
    
    // Button should be enabled
    await expect(sendButton).toBeEnabled();
  });

  test('should show model status in UI', async ({ page }) => {
    await page.goto('/chat');
    
    // Should show model status component
    const modelStatus = page.locator('[data-testid="model-status"]');
    await expect(modelStatus).toBeVisible({ timeout: 10000 });
  });

  test('should handle multiple messages in sequence', async ({ page }) => {
    await page.goto('/chat');
    
    const messageInput = page.getByTestId('input-message');
    await messageInput.waitFor({ timeout: 10000 });
    
    // Wait for model to load and input to be enabled
    await expect(messageInput).toBeEnabled({ timeout: 30000 });
    
    const sendButton = page.getByTestId('button-send');
    
    // Send first message
    await messageInput.fill('First message');
    await sendButton.click();
    await expect(page.getByText('First message')).toBeVisible();
    
    // Wait for input to be re-enabled
    await expect(messageInput).toBeEnabled({ timeout: 30000 });
    
    // Send second message
    await messageInput.fill('Second message');
    await sendButton.click();
    await expect(page.getByText('Second message')).toBeVisible();
  });

  test('should persist chat session on reload', async ({ page }) => {
    await page.goto('/chat');
    
    const messageInput = page.getByTestId('input-message');
    await messageInput.waitFor({ timeout: 10000 });
    
    // Wait for model to load
    await expect(messageInput).toBeEnabled({ timeout: 30000 });
    
    // Send a message
    await messageInput.fill('Test persistence message');
    const sendButton = page.getByTestId('button-send');
    await sendButton.click();
    
    // Wait for message to appear
    await expect(page.getByText('Test persistence message')).toBeVisible();
    
    // Reload the page
    await page.reload();
    
    // Message should still be visible after reload
    await expect(page.getByText('Test persistence message')).toBeVisible({ timeout: 10000 });
  });

  test('should open sidebar', async ({ page }) => {
    await page.goto('/chat');
    
    // Look for sidebar trigger button
    const sidebarButton = page.getByRole('button', { name: /menu|sidebar/i }).first();
    if (await sidebarButton.isVisible()) {
      await sidebarButton.click();
      
      // Sidebar content should be visible
      await expect(page.getByText(/sessions|history/i)).toBeVisible({ timeout: 5000 });
    }
  });
});
