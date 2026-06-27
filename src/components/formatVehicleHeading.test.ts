import { describe, expect, it } from "vitest";
import { formatVehicleHeading } from "./formatVehicleHeading";

describe("formatVehicleHeading", () => {
  it("formats zero heading", () => {
    expect(formatVehicleHeading(0)).toBe("0°");
  });

  it("converts radians to degrees", () => {
    expect(formatVehicleHeading(Math.PI / 2)).toBe("90°");
    expect(formatVehicleHeading(Math.PI)).toBe("180°");
    expect(formatVehicleHeading((3 * Math.PI) / 2)).toBe("270°");
  });

  it("normalizes full rotation back to zero", () => {
    expect(formatVehicleHeading(Math.PI * 2)).toBe("0°");
  });

  it("normalizes negative heading", () => {
    expect(formatVehicleHeading(-Math.PI / 2)).toBe("270°");
  });

  it("rounds partial degrees consistently", () => {
    expect(formatVehicleHeading(Math.PI / 4)).toBe("45°");
  });

  it("returns zero degrees for invalid values", () => {
    expect(formatVehicleHeading(Number.NaN)).toBe("0°");
    expect(formatVehicleHeading(Number.POSITIVE_INFINITY)).toBe("0°");
  });
});
