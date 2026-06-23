/**
 * Application smoke tests.
 *
 * Verifies that AutoDrive ReactLab starts in a real browser and exposes
 * the first stable UI contract needed by future E2E tests.
 */

import { expect, test } from "@playwright/test";

test.describe("AutoDrive ReactLab startup", () => {
  test("loads the application and renders the core UI", async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });

    await page.goto("/");

    await expect(page).toHaveTitle(/AutoDrive ReactLab/i);

    await expect(
      page.getByRole("heading", { level: 1, name: /AutoDrive Lab|AutoDrive ReactLab/i }),
    ).toBeVisible();

    await expect(page.getByText("Autonomous Simulation Lab")).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Simulation Canvas" }),
    ).toBeVisible();

    await expect(page.getByTestId("simulation-canvas")).toBeVisible();

    await expect(page.getByRole("heading", { name: "Controls" })).toBeVisible();

    await expect(page.getByRole("button", { name: "Start" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Reset" })).toBeVisible();

    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

    const metrics = page.locator("dl");

    await expect(metrics.getByText("Speed", { exact: true })).toBeVisible();
    await expect(metrics.getByText("Simulation", { exact: true })).toBeVisible();
    await expect(metrics.getByText("FPS", { exact: true })).toBeVisible();

    expect(consoleErrors).toEqual([]);
  });
});