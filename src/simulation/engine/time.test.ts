import { describe, expect, it } from "vitest";
import {
  clampDeltaTime,
  millisecondsToSeconds,
  normalizeFrameDeltaSeconds,
} from "./time";

describe("delta time utilities", () => {
  it("converts milliseconds to seconds", () => {
    expect(millisecondsToSeconds(1000)).toBe(1);
    expect(millisecondsToSeconds(16)).toBe(0.016);
  });

  it("clamps large delta time", () => {
    expect(clampDeltaTime(0.2)).toBe(0.05);
  });

  it("preserves normal delta time", () => {
    expect(clampDeltaTime(0.016)).toBe(0.016);
  });

  it("normalizes raw frame delta milliseconds into clamped seconds", () => {
    expect(normalizeFrameDeltaSeconds(16)).toBe(0.016);
    expect(normalizeFrameDeltaSeconds(200)).toBe(0.05);
  });

  it("rejects invalid values", () => {
    expect(() => millisecondsToSeconds(-1)).toThrow(RangeError);
    expect(() => clampDeltaTime(Number.NaN)).toThrow(RangeError);
    expect(() => normalizeFrameDeltaSeconds(Number.POSITIVE_INFINITY)).toThrow(
      RangeError,
    );
  });
});
