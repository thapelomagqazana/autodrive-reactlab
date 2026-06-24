/**
 * Application smoke tests.
 *
 * Verifies that AutoDrive ReactLab starts in a real browser and exposes
 * the stable UI contract needed by future E2E tests.
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
      page.getByRole("heading", {
        level: 1,
        name: /AutoDrive Lab|AutoDrive ReactLab/i,
      }),
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

    await expect(page.getByText("Idle")).toBeVisible();
    await expect(page.getByText("Elapsed Time")).toBeVisible();
    await expect(page.getByText("00:00:00.000")).toBeVisible();
    await expect(page.getByText("FPS", { exact: true })).toBeVisible();

    await expect(
      page.getByRole("region", { name: "Vehicle Telemetry" }),
    ).toBeVisible();

    await expect(page.getByText("Vehicle Speed")).toBeVisible();
    await expect(page.getByText("AI Decision")).toBeVisible();
    await expect(page.getByText("Waiting for simulation")).toBeVisible();

    await page.getByRole("button", { name: "Start" }).click();
    await expect(page.getByText("Running")).toBeVisible();

    await page.getByRole("button", { name: "Pause" }).click();
    await expect(page.getByText("Paused")).toBeVisible();

    await page.getByRole("button", { name: "Reset" }).click();
    await expect(page.getByText("Idle")).toBeVisible();

    expect(consoleErrors).toEqual([]);
  });
});