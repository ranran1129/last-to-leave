import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5178',
    viewport: { width: 1280, height: 800 },
    trace: 'off',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'mobile', use: { ...devices['Pixel 5'] } }, // chromium-based, touch + 393x851
  ],
  webServer: {
    command: 'npm run dev -- --port 5178 --strictPort',
    port: 5178,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
