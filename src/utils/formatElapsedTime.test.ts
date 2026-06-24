import { describe, expect, it } from "vitest";
import { formatElapsedTime } from "./formatElapsedTime";

describe("formatElapsedTime", () => {
  it("formats zero", () => {
    expect(formatElapsedTime(0)).toBe("00:00:00.000");
  });

  it("formats milliseconds", () => {
    expect(formatElapsedTime(1.234)).toBe("00:00:01.234");
  });

  it("formats minutes and hours", () => {
    expect(formatElapsedTime(3661.007)).toBe("01:01:01.007");
  });

  it("guards invalid values", () => {
    expect(formatElapsedTime(Number.NaN)).toBe("00:00:00.000");
    expect(formatElapsedTime(Number.POSITIVE_INFINITY)).toBe("00:00:00.000");
    expect(formatElapsedTime(-1)).toBe("00:00:00.000");
  });
});