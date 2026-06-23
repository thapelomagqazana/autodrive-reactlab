/**
 * Shared test setup for AutoDrive ReactLab.
 *
 * This file is loaded before each Vitest test file.
 *
 * Responsibilities:
 * - Enable jest-dom matchers for readable DOM assertions.
 * - Clean up React trees after each test.
 * - Keep test isolation predictable.
 */

import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

/**
 * Ensures each test starts with a clean DOM.
 *
 * This prevents one component test from leaking rendered markup,
 * event handlers, or state into another test.
 */
afterEach(() => {
  cleanup();
});