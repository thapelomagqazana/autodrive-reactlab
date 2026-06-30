import { expect, test } from "@playwright/test";

test.describe("AutoDrive performance checks", () => {
  test("tracks FPS while running", async ({ page }) => {
    await page.goto("/");

    const fpsCard = page.getByTestId("fps-telemetry");

    await expect(fpsCard).toContainText("FPS");
    await expect(fpsCard).toContainText("0");

    await page.getByRole("button", { name: "Start" }).click();

    await expect(fpsCard).not.toContainText(/^FPS\s*0$/, {
      timeout: 3000,
    });
  });

  test("does not create runaway console errors during start pause reset", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];

    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });

    await page.goto("/");

    await page.getByRole("button", { name: "Start" }).click();
    await page.waitForTimeout(500);

    await page.getByRole("button", { name: "Pause" }).click();
    await page.waitForTimeout(250);

    await page.getByRole("button", { name: "Start" }).click();
    await page.waitForTimeout(500);

    await page.getByRole("button", { name: "Reset" }).click();

    expect(consoleErrors).toEqual([]);
  });
});
