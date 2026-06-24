import { describe, expect, it } from "vitest";
import { calculateCanvasBufferSize, normalizePixelRatio } from "./canvasSizing";

describe("canvasSizing", () => {
  it("normalizes invalid device pixel ratios", () => {
    expect(normalizePixelRatio(undefined)).toBe(1);
    expect(normalizePixelRatio(0)).toBe(1);
    expect(normalizePixelRatio(-1)).toBe(1);
    expect(normalizePixelRatio(Number.NaN)).toBe(1);
  });

  it("caps very large device pixel ratios", () => {
    expect(normalizePixelRatio(10)).toBe(3);
  });

  it("calculates drawing buffer size from CSS size and pixel ratio", () => {
    expect(calculateCanvasBufferSize({ width: 800, height: 400 }, 2)).toEqual({
      width: 1600,
      height: 800,
      pixelRatio: 2,
    });
  });

  it("handles fractional dimensions safely", () => {
    expect(calculateCanvasBufferSize({ width: 800.9, height: 400.9 }, 1)).toEqual({
      width: 800,
      height: 400,
      pixelRatio: 1,
    });
  });

  it("handles zero dimensions safely", () => {
    expect(calculateCanvasBufferSize({ width: 0, height: 0 }, 2)).toEqual({
      width: 0,
      height: 0,
      pixelRatio: 2,
    });
  });
});
