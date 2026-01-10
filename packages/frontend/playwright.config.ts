import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for Task Assistant E2E tests.
 *
 * Run tests: pnpm test:e2e
 * Debug: pnpm test:e2e:debug
 * UI Mode: pnpm test:e2e:ui
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html"], ["list"]],
  timeout: 30000,

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  /* Reuse existing dev server when running locally */
  webServer: process.env.CI
    ? {
        command: "pnpm docker:dev",
        url: "http://localhost:3000",
        reuseExistingServer: false,
        timeout: 120 * 1000,
        cwd: "../..",
      }
    : undefined,
});
