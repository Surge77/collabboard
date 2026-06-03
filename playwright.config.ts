import { defineConfig, devices } from '@playwright/test';

const baseURL = 'http://localhost:3000';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  globalSetup: './tests/e2e/global-setup.ts',
  use: { baseURL, trace: 'on-first-retry' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm dev',
    url: baseURL,
    // NEXT_PUBLIC_E2E_HOOKS exposes the Excalidraw scene handle the sync spec
    // reads. Inlined at dev-server start, so the server must be launched here.
    env: { ...process.env, NEXT_PUBLIC_E2E_HOOKS: '1' },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
