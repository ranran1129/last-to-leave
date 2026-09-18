import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    // LTL_BASE lets the same suite run against a production build or the deployed site
    baseURL: process.env.LTL_BASE ?? 'http://localhost:5178',
    viewport: { width: 1280, height: 800 },
    trace: 'off',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    // 本作は横持ち前提。実機と同じく「横向きのスマホ」で通す
    { name: 'mobile', use: { ...devices['Pixel 5 landscape'] } }, // chromium-based, touch + 851x393
  ],
  webServer: process.env.LTL_BASE ? undefined : {
    command: 'npm run dev -- --port 5178 --strictPort',
    port: 5178,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
