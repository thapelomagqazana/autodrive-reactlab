import { describe, expect, it, vi } from "vitest";
import { calculateGridLines, renderBackgroundGrid } from "./gridRenderer";

describe("gridRenderer", () => {
  it("calculates vertical and horizontal grid lines", () => {
    const lines = calculateGridLines({
      width: 80,
      height: 40,
      spacing: 40,
    });

    expect(lines).toEqual([
      { fromX: 0, fromY: 0, toX: 0, toY: 40 },
      { fromX: 40, fromY: 0, toX: 40, toY: 40 },
      { fromX: 80, fromY: 0, toX: 80, toY: 40 },
      { fromX: 0, fromY: 0, toX: 80, toY: 0 },
      { fromX: 0, fromY: 40, toX: 80, toY: 40 },
    ]);
  });

  it("returns no lines when disabled", () => {
    expect(
      calculateGridLines({
        width: 100,
        height: 100,
        enabled: false,
      }),
    ).toEqual([]);
  });

  it("handles zero dimensions safely", () => {
    expect(calculateGridLines({ width: 0, height: 100 })).toEqual([]);
    expect(calculateGridLines({ width: 100, height: 0 })).toEqual([]);
  });

  it("uses safe spacing when spacing is invalid", () => {
    const lines = calculateGridLines({
      width: 80,
      height: 80,
      spacing: 0,
    });

    expect(lines.length).toBeGreaterThan(0);
  });

  it("draws grid lines using the canvas context", () => {
    const context = {
        save: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        strokeStyle: "",
        fillStyle: "",
        lineWidth: 1,
    } as unknown as CanvasRenderingContext2D;

    renderBackgroundGrid(context, {
        width: 80,
        height: 40,
        spacing: 40,
    });

    expect(context.save).toHaveBeenCalledTimes(1);
    expect(context.beginPath).toHaveBeenCalled();
    expect(context.moveTo).toHaveBeenCalled();
    expect(context.lineTo).toHaveBeenCalled();
    expect(context.stroke).toHaveBeenCalledTimes(1);
    expect(context.arc).toHaveBeenCalled();
    expect(context.fill).toHaveBeenCalled();
    expect(context.restore).toHaveBeenCalledTimes(1);
  });
});