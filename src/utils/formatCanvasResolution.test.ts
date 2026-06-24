import { describe, expect, it } from "vitest";
import { formatCanvasResolution } from "./formatCanvasResolution";

describe("formatCanvasResolution", () => {
  it("formats valid dimensions", () => {
    expect(formatCanvasResolution(1280, 720)).toBe("1280 × 720");
  });

  it("rounds fractional dimensions", () => {
    expect(formatCanvasResolution(1279.6, 719.4)).toBe("1280 × 719");
  });

  it("guards invalid dimensions", () => {
    expect(formatCanvasResolution(Number.NaN, Number.POSITIVE_INFINITY)).toBe("0 × 0");
  });

  it("guards negative dimensions", () => {
    expect(formatCanvasResolution(-10, -20)).toBe("0 × 0");
  });
});
