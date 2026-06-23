/**
 * Shared Vitest setup for AutoDrive ReactLab.
 *
 * This file is executed before test files.
 *
 * Keep this file small and deterministic:
 * - test-wide mocks belong here
 * - browser API polyfills belong here
 * - one-off test data does not belong here
 */

import { afterEach } from "vitest";

/**
 * Reset document body after every test.
 *
 * This prevents DOM state from leaking between tests and producing
 * false positives or flaky behavior.
 */
afterEach(() => {
  document.body.innerHTML = "";
});