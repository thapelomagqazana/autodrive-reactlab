/**
 * Unit tests for frame renderer lifecycle utilities.
 */

import { describe, expect, it, vi } from "vitest";
import { beginFrame, clearFrame, endFrame } from "./frameRenderer";

function createMockContext(): CanvasRenderingContext2D {
  return {
    clearRect: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

describe("frameRenderer", () => {
  it("clears the full canvas drawing buffer", () => {
    const context = createMockContext();

    clearFrame(context, {
      width: 800,
      height: 400,
    });

    expect(context.clearRect).toHaveBeenCalledWith(0, 0, 800, 400);
  });

  it("floors fractional dimensions before clearing", () => {
    const context = createMockContext();

    clearFrame(context, {
      width: 800.9,
      height: 400.8,
    });

    expect(context.clearRect).toHaveBeenCalledWith(0, 0, 800, 400);
  });

  it("does not clear when width is zero", () => {
    const context = createMockContext();

    clearFrame(context, {
      width: 0,
      height: 400,
    });

    expect(context.clearRect).not.toHaveBeenCalled();
  });

  it("does not clear when height is zero", () => {
    const context = createMockContext();

    clearFrame(context, {
      width: 800,
      height: 0,
    });

    expect(context.clearRect).not.toHaveBeenCalled();
  });

  it("does not clear invalid dimensions", () => {
    const context = createMockContext();

    clearFrame(context, {
      width: Number.NaN,
      height: Number.POSITIVE_INFINITY,
    });

    expect(context.clearRect).not.toHaveBeenCalled();
  });

  it("beginFrame clears the frame", () => {
    const context = createMockContext();

    beginFrame(context, {
      width: 320,
      height: 240,
    });

    expect(context.clearRect).toHaveBeenCalledWith(0, 0, 320, 240);
  });

  it("endFrame executes safely", () => {
    expect(() => endFrame()).not.toThrow();
  });

  it("can clear repeatedly without extra setup", () => {
    const context = createMockContext();

    clearFrame(context, { width: 100, height: 100 });
    clearFrame(context, { width: 100, height: 100 });
    clearFrame(context, { width: 100, height: 100 });

    expect(context.clearRect).toHaveBeenCalledTimes(3);
  });
});