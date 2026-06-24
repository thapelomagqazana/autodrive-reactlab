import { describe, expect, it } from "vitest";
import {
  DEFAULT_ROAD,
  assertValidRoad,
  createInitialRoad,
  getLaneCenterX,
  getLaneDividerLines,
  getLaneWidth,
  getRoadBoundaryLines,
  getRoadLeftEdgeX,
  getRoadLines,
  getRoadRightEdgeX,
  isPositiveRoadSize,
  isValidLaneCount,
} from "./road";

describe("road domain model", () => {
  it("creates the default MVP road", () => {
    expect(createInitialRoad()).toEqual(DEFAULT_ROAD);
  });

  it("returns a fresh road object every time", () => {
    const first = createInitialRoad();
    const second = createInitialRoad();

    expect(first).toEqual(second);
    expect(first).not.toBe(second);
  });

  it("defines positive road width and lane count", () => {
    const road = createInitialRoad();

    expect(road.width).toBeGreaterThan(0);
    expect(road.laneCount).toBeGreaterThan(0);
  });

  it("calculates road edges from center and width", () => {
    const road = createInitialRoad();

    expect(getRoadLeftEdgeX(road)).toBe(220);
    expect(getRoadRightEdgeX(road)).toBe(580);
  });

  it("calculates lane width", () => {
    const road = createInitialRoad();

    expect(getLaneWidth(road)).toBe(120);
  });

  it("calculates lane centers for the default three-lane road", () => {
    const road = createInitialRoad();

    expect(getLaneCenterX(road, 0)).toBe(280);
    expect(getLaneCenterX(road, 1)).toBe(400);
    expect(getLaneCenterX(road, 2)).toBe(520);
  });

  it("creates exactly two boundary lines", () => {
    const lines = getRoadBoundaryLines(createInitialRoad());

    expect(lines).toHaveLength(2);
    expect(lines.every((line) => line.kind === "boundary")).toBe(true);
  });

  it("creates lane divider lines from lane count", () => {
    const lines = getLaneDividerLines(createInitialRoad());

    expect(lines).toHaveLength(2);
    expect(lines.every((line) => line.kind === "divider")).toBe(true);
    expect(lines.map((line) => line.startX)).toEqual([340, 460]);
  });

  it("creates no dividers for a one-lane road", () => {
    const road = {
      centerX: 400,
      width: 360,
      laneCount: 1,
      topY: 0,
      bottomY: 900,
    };

    expect(getLaneDividerLines(road)).toEqual([]);
  });

  it("returns all road lines in a single list", () => {
    const lines = getRoadLines(createInitialRoad());

    expect(lines).toHaveLength(4);
    expect(lines[0]?.kind).toBe("boundary");
    expect(lines[1]?.kind).toBe("boundary");
    expect(lines[2]?.kind).toBe("divider");
    expect(lines[3]?.kind).toBe("divider");
  });

  it("validates road sizes and lane counts", () => {
    expect(isPositiveRoadSize(1)).toBe(true);
    expect(isPositiveRoadSize(0)).toBe(false);
    expect(isPositiveRoadSize(-1)).toBe(false);

    expect(isValidLaneCount(1)).toBe(true);
    expect(isValidLaneCount(3)).toBe(true);
    expect(isValidLaneCount(0)).toBe(false);
    expect(isValidLaneCount(1.5)).toBe(false);
  });

  it("rejects invalid road dimensions", () => {
    expect(() =>
      assertValidRoad({
        centerX: 400,
        width: 0,
        laneCount: 3,
        topY: 0,
        bottomY: 900,
      }),
    ).toThrow(RangeError);

    expect(() =>
      assertValidRoad({
        centerX: 400,
        width: 360,
        laneCount: 0,
        topY: 0,
        bottomY: 900,
      }),
    ).toThrow(RangeError);
  });

  it("rejects invalid vertical bounds", () => {
    expect(() =>
      assertValidRoad({
        centerX: 400,
        width: 360,
        laneCount: 3,
        topY: 900,
        bottomY: 0,
      }),
    ).toThrow(RangeError);
  });

  it("rejects invalid lane indexes", () => {
    const road = createInitialRoad();

    expect(() => getLaneCenterX(road, -1)).toThrow(RangeError);
    expect(() => getLaneCenterX(road, road.laneCount)).toThrow(RangeError);
    expect(() => getLaneCenterX(road, 1.5)).toThrow(RangeError);
  });
});
