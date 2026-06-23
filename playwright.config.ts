/**
 * Playwright configuration for AutoDrive ReactLab.
 *
 * This config establishes browser-level validation for the application.
 * It automatically starts the Vite dev server, runs deterministic smoke tests,
 * and captures useful debugging artifacts on failure.
 */

import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",

  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },

  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [["html", { outputFolder: "playwright-report", open: "never" }], ["list"]],

  use: {
    baseURL: BASE_URL,

    /**
     * Capture artifacts only when useful.
     * This keeps local runs fast while preserving evidence for failed tests.
     */
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  /**
   * Run against the major browser engines.
   * Chromium is the daily fast path; Firefox/WebKit catch compatibility issues.
   */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],

  /**
   * Use Vite preview instead of dev mode for E2E.
   * This validates the production build output more realistically.
   */
  webServer: {
    command: "npm run build && npm run preview -- --host 127.0.0.1 --port 4173",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});