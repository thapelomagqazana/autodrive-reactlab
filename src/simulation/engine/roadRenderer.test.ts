import { describe, expect, it, vi } from "vitest";
import { createInitialRoad } from "../world";
import {
  DEFAULT_DRAW_ROAD_OPTIONS,
  drawRoad,
  drawRoadLine,
  drawRoadSurface,
} from "./roadRenderer";

function createMockContext(): CanvasRenderingContext2D {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    setLineDash: vi.fn(),
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
  } as unknown as CanvasRenderingContext2D;
}

describe("drawRoad", () => {
  it("draws the road surface from road dimensions", () => {
    const context = createMockContext();
    const road = createInitialRoad();

    drawRoadSurface(context, road, DEFAULT_DRAW_ROAD_OPTIONS);

    expect(context.fillRect).toHaveBeenCalledWith(220, -2000, 360, 2900);
  });

  it("draws road boundaries and lane dividers", () => {
    const context = createMockContext();

    drawRoad(context, createInitialRoad());

    expect(context.fillRect).toHaveBeenCalledOnce();
    expect(context.beginPath).toHaveBeenCalledTimes(4);
    expect(context.stroke).toHaveBeenCalledTimes(4);
  });

  it("draws boundaries before dividers", () => {
    const context = createMockContext();

    drawRoad(context, createInitialRoad());

    expect(context.moveTo).toHaveBeenNthCalledWith(1, 220, -2000);
    expect(context.moveTo).toHaveBeenNthCalledWith(2, 580, -2000);
    expect(context.moveTo).toHaveBeenNthCalledWith(3, 340, -2000);
    expect(context.moveTo).toHaveBeenNthCalledWith(4, 460, -2000);
  });

  it("restores canvas state after drawing", () => {
    const context = createMockContext();

    drawRoad(context, createInitialRoad());

    expect(context.save).toHaveBeenCalled();
    expect(context.restore).toHaveBeenCalled();
  });

  it("does not mutate the road model", () => {
    const context = createMockContext();
    const road = createInitialRoad();
    const snapshot = structuredClone(road);

    drawRoad(context, road);

    expect(road).toEqual(snapshot);
  });

  it("supports custom styling options", () => {
    const context = createMockContext();

    drawRoad(context, createInitialRoad(), {
      surfaceColor: "black",
      boundaryColor: "white",
      dividerColor: "gray",
      dividerDash: [4, 2],
    });

    expect(context.fillStyle).toBe("black");
    expect(context.setLineDash).toHaveBeenCalledWith([4, 2]);
  });

  it("can draw the optional center guide", () => {
    const context = createMockContext();

    drawRoad(context, createInitialRoad(), {
      showCenterGuide: true,
    });

    expect(context.stroke).toHaveBeenCalledTimes(5);
    expect(context.moveTo).toHaveBeenLastCalledWith(400, -2000);
    expect(context.lineTo).toHaveBeenLastCalledWith(400, 900);
  });

  it("draws one explicit road line", () => {
    const context = createMockContext();

    drawRoadLine(
      context,
      {
        startX: 1,
        startY: 2,
        endX: 3,
        endY: 4,
        kind: "boundary",
      },
      {
        color: "white",
        lineWidth: 2,
        dash: [],
      },
    );

    expect(context.beginPath).toHaveBeenCalledOnce();
    expect(context.moveTo).toHaveBeenCalledWith(1, 2);
    expect(context.lineTo).toHaveBeenCalledWith(3, 4);
    expect(context.stroke).toHaveBeenCalledOnce();
  });
});
