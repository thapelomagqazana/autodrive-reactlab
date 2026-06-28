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

    await expect(page.getByText("Autonomous Vehicle Mission Control")).toBeVisible();

    await expect(page.getByRole("heading", { name: "Simulation Canvas" })).toBeVisible();

    const canvas = page.getByTestId("simulation-canvas");
    await expect(canvas).toBeVisible();

    await expect(page.getByText("Road + Car Online")).toBeVisible();

    const hasRenderedPixels = await canvas.evaluate((element) => {
      const canvasElement = element as HTMLCanvasElement;
      const context = canvasElement.getContext("2d");

      if (!context || canvasElement.width === 0 || canvasElement.height === 0) {
        return false;
      }

      const imageData = context.getImageData(
        0,
        0,
        canvasElement.width,
        canvasElement.height,
      );

      return imageData.data.some((value) => value !== 0);
    });

    expect(hasRenderedPixels).toBe(true);

    await expect(page.getByRole("heading", { name: "Controls" })).toBeVisible();

    await expect(page.getByRole("button", { name: "Start" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Reset" })).toBeVisible();

    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

    await expect(page.getByText("Idle")).toBeVisible();
    await expect(page.getByText("Elapsed Time")).toBeVisible();
    await expect(page.getByText("00:00:00.000")).toBeVisible();
    await expect(page.getByText("FPS", { exact: true })).toBeVisible();

    const vehicleTelemetry = page.getByRole("region", {
      name: "Vehicle Telemetry",
    });

    await expect(vehicleTelemetry).toBeVisible();

    await expect(vehicleTelemetry.getByText("Vehicle Speed")).toBeVisible();
    await expect(vehicleTelemetry.getByText("0 px/s", { exact: true })).toBeVisible();

    await expect(vehicleTelemetry.getByText("Acceleration")).toBeVisible();
    await expect(vehicleTelemetry.getByText("120 px/s²", { exact: true })).toBeVisible();

    await expect(vehicleTelemetry.getByText("Steering Angle")).toBeVisible();
    await expect(vehicleTelemetry.getByText("0°", { exact: true })).toBeVisible();

    await expect(vehicleTelemetry.getByText("AI Decision")).toBeVisible();
    await expect(vehicleTelemetry.getByText("Waiting for simulation")).toBeVisible();

    await page.getByRole("button", { name: "Start" }).click();
    await expect(page.getByText("Running")).toBeVisible();

    await page.getByRole("button", { name: "Pause" }).click();
    await expect(page.getByText("Paused")).toBeVisible();

    await page.getByRole("button", { name: "Reset" }).click();
    await expect(page.getByText("Idle")).toBeVisible();

    expect(consoleErrors).toEqual([]);
  });
});
