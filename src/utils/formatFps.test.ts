import { describe, expect, it } from "vitest";
import { formatFps } from "./formatFps";

describe("formatFps", () => {
  it("formats FPS", () => {
    expect(formatFps(0)).toBe("0");
    expect(formatFps(59.6)).toBe("60");
  });

  it("guards invalid FPS values", () => {
    expect(formatFps(Number.NaN)).toBe("0");
    expect(formatFps(Number.POSITIVE_INFINITY)).toBe("0");
    expect(formatFps(-1)).toBe("0");
  });
});