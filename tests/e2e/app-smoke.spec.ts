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

    /*
    |--------------------------------------------------------------------------
    | Vehicle tab (default)
    |--------------------------------------------------------------------------
    */

    await expect(page.getByRole("tab", { name: "Vehicle" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await expect(page.getByTestId("vehicle-speed-telemetry")).toContainText(
      "Vehicle Speed",
    );
    await expect(page.getByTestId("vehicle-speed-telemetry")).toContainText("0 px/s");

    await expect(page.getByTestId("vehicle-acceleration-telemetry")).toContainText(
      "120 px/s²",
    );

    await expect(page.getByTestId("vehicle-heading-telemetry")).toContainText("Heading");

    await expect(page.getByTestId("vehicle-position-telemetry")).toContainText(
      "Position",
    );

    await expect(page.getByTestId("road-status-telemetry")).toContainText("On road");

    /*
    |--------------------------------------------------------------------------
    | Performance tab
    |--------------------------------------------------------------------------
    */

    await page.getByRole("tab", { name: "Performance" }).click();

    await expect(page.getByRole("tab", { name: "Performance" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await expect(page.getByTestId("fps-telemetry")).toBeVisible();

    /*
    |--------------------------------------------------------------------------
    | AI tab
    |--------------------------------------------------------------------------
    */

    await page.getByRole("tab", { name: "AI" }).click();

    await expect(page.getByText("AI Decision")).toBeVisible();
    await expect(page.getByText("Waiting for simulation")).toBeVisible();

    await expect(page.getByText("Sensor Status")).toBeVisible();
    await expect(page.getByText("Destination Status")).toBeVisible();

    /*
    |--------------------------------------------------------------------------
    | Debug tab
    |--------------------------------------------------------------------------
    */

    await page.getByRole("tab", { name: "Debug" }).click();

    await expect(page.getByTestId("vehicle-steering-telemetry")).toContainText(
      "Steering Angle",
    );

    await expect(page.getByTestId("vehicle-steering-telemetry")).toContainText("0°");

    await expect(page.getByText("Collision Count")).toBeVisible();
    await expect(page.getByText("Lane")).toBeVisible();
    await expect(page.getByTestId("camera-debug-telemetry")).toContainText("Camera");
    await expect(page.getByText("Offsets")).toBeVisible();
  });
});
