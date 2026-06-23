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
      page.getByRole("heading", { name: "AutoDrive Lab" }),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Simulation State" }),
    ).toBeVisible();

    const metrics = page.locator("dl");

    await expect(metrics.getByText("Status", { exact: true })).toBeVisible();
    await expect(metrics.getByText("Elapsed Time", { exact: true })).toBeVisible();
    await expect(metrics.getByText("FPS", { exact: true })).toBeVisible();

    await expect(page.getByRole("button", { name: "Start" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Reset" })).toBeVisible();

    expect(consoleErrors).toEqual([]);
  });
});