import { describe, expect, it } from "vitest";
import { formatVehiclePosition } from "./formatVehiclePosition";

describe("formatVehiclePosition", () => {
  it("formats integer coordinates", () => {
    expect(formatVehiclePosition(450, 720)).toBe("X: 450 | Y: 720");
  });

  it("rounds decimal coordinates", () => {
    expect(formatVehiclePosition(450.4, 719.6)).toBe("X: 450 | Y: 720");
  });

  it("falls back to zero for invalid coordinates", () => {
    expect(formatVehiclePosition(Number.NaN, Number.POSITIVE_INFINITY)).toBe(
      "X: 0 | Y: 0",
    );
  });
});
