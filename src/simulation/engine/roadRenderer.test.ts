import { describe, expect, it, vi } from "vitest";
import { createInitialRoad } from "../world";
import {
  DEFAULT_DRAW_ROAD_OPTIONS,
  drawRoad,
  drawRoadLine,
  drawRoadSurface,
  getRoadSurfaceRect,
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

describe("road surface rendering", () => {
  it("calculates the default road surface rectangle from road geometry", () => {
    const road = createInitialRoad();

    expect(getRoadSurfaceRect(road)).toEqual({
      x: 220,
      y: -2000,
      width: 360,
      height: 2900,
    });
  });

  it("draws the road surface using model-derived dimensions", () => {
    const context = createMockContext();

    drawRoadSurface(context, createInitialRoad(), DEFAULT_DRAW_ROAD_OPTIONS);

    expect(context.fillRect).toHaveBeenCalledWith(220, -2000, 360, 2900);
  });

  it("uses the configured surface color", () => {
    const context = createMockContext();

    drawRoadSurface(context, createInitialRoad(), {
      surfaceColor: "rgb(1 2 3)",
    });

    expect(context.fillStyle).toBe("rgb(1 2 3)");
  });

  it("saves and restores canvas state", () => {
    const context = createMockContext();

    drawRoadSurface(context, createInitialRoad(), DEFAULT_DRAW_ROAD_OPTIONS);

    expect(context.save).toHaveBeenCalledOnce();
    expect(context.restore).toHaveBeenCalledOnce();
  });

  it("supports custom road dimensions without hardcoded bounds", () => {
    const road = {
      centerX: 500,
      width: 200,
      laneCount: 2,
      topY: 10,
      bottomY: 1010,
    };

    expect(getRoadSurfaceRect(road)).toEqual({
      x: 400,
      y: 10,
      width: 200,
      height: 1000,
    });
  });

  it("supports fractional road dimensions", () => {
    const road = {
      centerX: 100.5,
      width: 50.5,
      laneCount: 1,
      topY: 0.5,
      bottomY: 900.5,
    };

    expect(getRoadSurfaceRect(road)).toEqual({
      x: 75.25,
      y: 0.5,
      width: 50.5,
      height: 900,
    });
  });

  it("rejects invalid road geometry before drawing", () => {
    const context = createMockContext();

    expect(() =>
      drawRoadSurface(
        context,
        {
          centerX: 400,
          width: 0,
          laneCount: 3,
          topY: 0,
          bottomY: 900,
        },
        DEFAULT_DRAW_ROAD_OPTIONS,
      ),
    ).toThrow(RangeError);
  });
});
