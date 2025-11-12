import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch({
    args: [
      '--enable-features=Vulkan',
      '--enable-unsafe-webgpu',
      '--use-angle=vulkan',
    ],
  });
  const page = await browser.newPage();
  
  // Mock WebGPU support
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'gpu', {
      value: {},
      writable: false,
      configurable: true,
    });
  });
  
  // Navigate to the app
  const baseURL = config.projects[0].use.baseURL || 'http://localhost:5000';
  await page.goto(baseURL);
  
  // Unregister all service workers for a clean test environment
  await page.evaluate(async () => {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
    }
  });
  
  console.log('✓ Service workers unregistered for clean test run');
  console.log('✓ WebGPU support mocked for tests');
  
  await browser.close();
}

export default globalSetup;
