import { describe, expect, it } from "vitest";
import { calculateFps, isValidFpsDeltaSeconds } from "./performanceMetrics";

describe("performanceMetrics", () => {
  it("calculates 60 FPS from 1/60 second delta", () => {
    expect(calculateFps(1 / 60)).toBeCloseTo(60, 5);
  });

  it("returns 0 for invalid or zero delta", () => {
    expect(calculateFps(0)).toBe(0);
    expect(calculateFps(Number.NaN)).toBe(0);
  });

  it("caps extremely high FPS values", () => {
    expect(calculateFps(0.000001)).toBe(240);
  });

  it("validates FPS delta seconds", () => {
    expect(isValidFpsDeltaSeconds(1 / 60)).toBe(true);
    expect(isValidFpsDeltaSeconds(0)).toBe(false);
  });

  it("rejects invalid configuration", () => {
    expect(() => calculateFps(1 / 60, 0)).toThrow(RangeError);
    expect(() => calculateFps(1 / 60, 1 / 240, 0)).toThrow(RangeError);
  });
});
