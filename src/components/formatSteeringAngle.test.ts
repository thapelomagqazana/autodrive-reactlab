import { describe, expect, it } from "vitest";
import { formatSteeringAngle } from "./formatSteeringAngle";

describe("formatSteeringAngle", () => {
  it("formats zero steering", () => {
    expect(formatSteeringAngle(0)).toBe("0°");
  });

  it("formats positive steering as positive degrees", () => {
    expect(formatSteeringAngle(Math.PI / 6)).toBe("30°");
  });

  it("formats negative steering as negative degrees", () => {
    expect(formatSteeringAngle(-Math.PI / 6)).toBe("-30°");
  });

  it("rounds partial degrees consistently", () => {
    expect(formatSteeringAngle(Math.PI / 12)).toBe("15°");
  });

  it("normalizes negative zero", () => {
    expect(formatSteeringAngle(-0)).toBe("0°");
  });

  it("returns zero degrees for invalid values", () => {
    expect(formatSteeringAngle(Number.NaN)).toBe("0°");
    expect(formatSteeringAngle(Number.POSITIVE_INFINITY)).toBe("0°");
  });
});
