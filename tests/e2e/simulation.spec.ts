import { expect, test } from "@playwright/test";

test.describe("AutoDrive simulation E2E", () => {
  test("loads simulation page", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/AutoDrive ReactLab/i);
    await expect(page.getByRole("heading", { name: /AutoDrive/i })).toBeVisible();
    await expect(page.getByTestId("simulation-canvas")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Controls" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });

  test("clicking Start starts the simulation", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Start" }).click();

    await expect(page.getByLabel(/Simulation status: Running/i)).toBeVisible();
  });

  test("pressing accelerate key changes car speed", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Start" }).click();

    const speedCard = page.getByTestId("vehicle-speed-telemetry");

    await expect(speedCard).toContainText("0 px/s");

    await page.keyboard.down("ArrowUp");

    await expect(speedCard).not.toContainText("0 px/s", {
      timeout: 3000,
    });

    await page.keyboard.up("ArrowUp");
  });

  test("pressing steering key changes steering value", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Start" }).click();

    const speedCard = page.getByTestId("vehicle-speed-telemetry");
    const steeringCard = page.getByTestId("vehicle-steering-telemetry");

    await expect(steeringCard).toContainText("0°");

    await page.keyboard.down("ArrowUp");

    await expect(speedCard).not.toContainText("0 px/s", {
      timeout: 3000,
    });

    await page.keyboard.down("ArrowLeft");

    await expect(steeringCard).toContainText("-30°", {
      timeout: 3000,
    });

    await page.keyboard.up("ArrowLeft");
    await page.keyboard.up("ArrowUp");
  });

  test("clicking Pause pauses the simulation", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Start" }).click();
    await expect(page.getByLabel(/Simulation status: Running/i)).toBeVisible();

    await page.getByRole("button", { name: "Pause" }).click();

    await expect(page.getByLabel(/Simulation status: Paused/i)).toBeVisible();
  });

  test("clicking Reset resets simulation without reload", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Start" }).click();
    await page.keyboard.down("ArrowUp");

    await expect(page.getByTestId("vehicle-speed-telemetry")).not.toContainText(
      "0 px/s",
      { timeout: 3000 },
    );

    await page.keyboard.up("ArrowUp");
    await page.getByRole("button", { name: "Reset" }).click();

    await expect(page.getByLabel(/Simulation status: Idle/i)).toBeVisible();
    await expect(page.getByTestId("vehicle-speed-telemetry")).toContainText("0 px/s");
    await expect(page.getByText("00:00:00.000")).toBeVisible();
  });
});
