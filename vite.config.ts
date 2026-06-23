/**
 * Vite configuration for AutoDrive ReactLab.
 *
 * This file configures:
 * - React support through the official Vite React plugin.
 * - Tailwind CSS v4 through the official Tailwind Vite plugin.
 *
 * Keeping Tailwind integration here makes the styling pipeline explicit,
 * fast, and compatible with Vite production builds.
 */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),

    /**
     * Tailwind CSS v4 Vite plugin.
     *
     * This enables Tailwind utility generation during development and
     * production builds without needing a separate PostCSS config.
     */
    tailwindcss(),
  ],
});