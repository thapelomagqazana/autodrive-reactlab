/**
 * Unit tests for simulation time utilities.
 *
 * These tests validate pure timing behavior before it is used by the future
 * requestAnimationFrame game loop.
 */

import { describe, expect, it } from "vitest";
import { clampDeltaTime, millisecondsToSeconds } from "./time";

describe("millisecondsToSeconds", () => {
  it("converts milliseconds to seconds", () => {
    expect(millisecondsToSeconds(1000)).toBe(1);
    expect(millisecondsToSeconds(250)).toBe(0.25);
  });

  it("supports zero milliseconds", () => {
    expect(millisecondsToSeconds(0)).toBe(0);
  });

  it("rejects invalid numeric input", () => {
    expect(() => millisecondsToSeconds(Number.NaN)).toThrow(
      "milliseconds must be a finite number",
    );

    expect(() => millisecondsToSeconds(Number.POSITIVE_INFINITY)).toThrow(
      "milliseconds must be a finite number",
    );
  });
});

describe("clampDeltaTime", () => {
  it("returns delta time when it is below the cap", () => {
    expect(clampDeltaTime(0.016, 0.1)).toBe(0.016);
  });

  it("caps large delta time values", () => {
    expect(clampDeltaTime(2, 0.1)).toBe(0.1);
  });

  it("uses 0.1 seconds as the default cap", () => {
    expect(clampDeltaTime(5)).toBe(0.1);
  });

  it("rejects negative delta time", () => {
    expect(() => clampDeltaTime(-0.1)).toThrow(
      "deltaSeconds must be a non-negative finite number",
    );
  });

  it("rejects invalid max delta time", () => {
    expect(() => clampDeltaTime(0.01, 0)).toThrow(
      "maxDeltaSeconds must be a positive finite number",
    );
  });
});
