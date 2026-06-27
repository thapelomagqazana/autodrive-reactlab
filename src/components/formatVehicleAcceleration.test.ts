import { describe, expect, it } from "vitest";
import { formatVehicleAcceleration } from "./formatVehicleAcceleration";

describe("formatVehicleAcceleration", () => {
  it("formats zero acceleration", () => {
    expect(formatVehicleAcceleration(0)).toBe("0");
  });

  it("rounds configured acceleration", () => {
    expect(formatVehicleAcceleration(119.4)).toBe("119");
    expect(formatVehicleAcceleration(119.5)).toBe("120");
  });

  it("returns zero for invalid acceleration", () => {
    expect(formatVehicleAcceleration(Number.NaN)).toBe("0");
    expect(formatVehicleAcceleration(Number.POSITIVE_INFINITY)).toBe("0");
  });
});
