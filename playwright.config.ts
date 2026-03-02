import { defineConfig } from '@playwright/test';

const port = process.env.PW_PORT ? Number(process.env.PW_PORT) : 4173;
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: {
    command: `python3 -m http.server ${port}`,
    port,
    cwd: './public',
    reuseExistingServer: !process.env.CI,
  },
});
