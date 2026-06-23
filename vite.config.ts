/// <reference types="vitest/config" />

/**
 * Vite and Vitest configuration for AutoDrive ReactLab.
 *
 * This file owns:
 * - Vite build/dev configuration
 * - React plugin configuration
 * - Tailwind CSS plugin configuration
 * - Vitest unit-test configuration
 *
 * Keeping Vitest close to Vite ensures the tests use the same TypeScript,
 * module resolution, and transformation pipeline as the application.
 */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],

  test: {
    /**
     * jsdom provides a browser-like DOM environment.
     *
     * This supports future tests for hooks and lightweight React behavior
     * without requiring a real browser.
     */
    environment: "jsdom",

    /**
     * Global test setup file.
     *
     * Keep shared mocks, custom matchers, and test cleanup here instead of
     * duplicating setup code in every test file.
     */
    setupFiles: ["./src/tests/setupTests.ts"],

    /**
     * Include only intentional test files.
     */
    include: ["src/**/*.{test,spec}.{ts,tsx}"],

    /**
     * Keep test output deterministic and readable.
     */
    reporters: ["default"],

    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json"],
      reportsDirectory: "./coverage",
      exclude: [
        "dist/**",
        "coverage/**",
        "node_modules/**",
        "src/main.tsx",
        "src/vite-env.d.ts",
        "**/*.config.*",
      ],
    },
  },
});