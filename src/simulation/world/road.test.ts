import { describe, expect, it } from "vitest";
import {
  DEFAULT_ROAD,
  DEFAULT_ROAD_CENTER_X,
  DEFAULT_ROAD_WIDTH,
  DEFAULT_ROAD_LANE_COUNT,
  assertValidLaneCount,
  assertValidRoad,
  assertValidRoadHorizontalGeometry,
  createInitialRoad,
  getAllLaneGeometries,
  getDefaultStartLaneCenterX,
  getDefaultStartLaneIndex,
  getLaneCenterX,
  getLaneGeometry,
  getLaneLeftEdgeX,
  getLaneRightEdgeX,
  getLaneDividerCount,
  getLaneDividerLines,
  getLaneWidth,
  getRoadBoundaryLines,
  getRoadHorizontalEdges,
  getRoadLeftEdgeX,
  getRoadLines,
  getRoadRightEdgeX,
  isPositiveRoadSize,
  isValidLaneCount,
  isValidRoadWidth,
  isValidLaneIndex,
  normalizeLaneCount,
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

describe("road width and horizontal position", () => {
  it("defines default road center and width", () => {
    const road = createInitialRoad();

    expect(road.centerX).toBe(DEFAULT_ROAD_CENTER_X);
    expect(road.width).toBe(DEFAULT_ROAD_WIDTH);
  });

  it("measures road width in positive pixels", () => {
    const road = createInitialRoad();

    expect(road.width).toBeGreaterThan(0);
  });

  it("derives the left edge from centerX and width", () => {
    const road = createInitialRoad();

    expect(getRoadLeftEdgeX(road)).toBe(220);
  });

  it("derives the right edge from centerX and width", () => {
    const road = createInitialRoad();

    expect(getRoadRightEdgeX(road)).toBe(580);
  });

  it("derives both horizontal edges from one source of truth", () => {
    const road = createInitialRoad();

    expect(getRoadHorizontalEdges(road)).toEqual({
      leftEdgeX: 220,
      rightEdgeX: 580,
    });
  });

  it("supports non-default road center and width", () => {
    const geometry = {
      centerX: 500,
      width: 200,
    };

    expect(getRoadLeftEdgeX(geometry)).toBe(400);
    expect(getRoadRightEdgeX(geometry)).toBe(600);
  });

  it("supports fractional road center and width", () => {
    const geometry = {
      centerX: 100.5,
      width: 50.5,
    };

    expect(getRoadLeftEdgeX(geometry)).toBeCloseTo(75.25);
    expect(getRoadRightEdgeX(geometry)).toBeCloseTo(125.75);
  });

  it("validates positive road width", () => {
    expect(isValidRoadWidth(1)).toBe(true);
    expect(isValidRoadWidth(360)).toBe(true);
    expect(isValidRoadWidth(0.5)).toBe(true);

    expect(isValidRoadWidth(0)).toBe(false);
    expect(isValidRoadWidth(-1)).toBe(false);
    expect(isValidRoadWidth(Number.NaN)).toBe(false);
    expect(isValidRoadWidth(Number.POSITIVE_INFINITY)).toBe(false);
  });

  it("rejects invalid horizontal geometry", () => {
    expect(() =>
      assertValidRoadHorizontalGeometry({
        centerX: Number.NaN,
        width: 360,
      }),
    ).toThrow(RangeError);

    expect(() =>
      assertValidRoadHorizontalGeometry({
        centerX: 400,
        width: 0,
      }),
    ).toThrow(RangeError);

    expect(() =>
      assertValidRoadHorizontalGeometry({
        centerX: 400,
        width: -1,
      }),
    ).toThrow(RangeError);
  });

  it("rejects invalid geometry before calculating edges", () => {
    expect(() =>
      getRoadLeftEdgeX({
        centerX: 400,
        width: 0,
      }),
    ).toThrow(RangeError);

    expect(() =>
      getRoadRightEdgeX({
        centerX: Number.POSITIVE_INFINITY,
        width: 360,
      }),
    ).toThrow(RangeError);
  });
});

describe("road lane count", () => {
  it("defines the default MVP lane count", () => {
    const road = createInitialRoad();

    expect(road.laneCount).toBe(DEFAULT_ROAD_LANE_COUNT);
    expect(road.laneCount).toBe(3);
  });

  it("requires lane count to be a positive integer", () => {
    expect(isValidLaneCount(1)).toBe(true);
    expect(isValidLaneCount(2)).toBe(true);
    expect(isValidLaneCount(3)).toBe(true);

    expect(isValidLaneCount(0)).toBe(false);
    expect(isValidLaneCount(-1)).toBe(false);
    expect(isValidLaneCount(1.5)).toBe(false);
    expect(isValidLaneCount(Number.NaN)).toBe(false);
    expect(isValidLaneCount(Number.POSITIVE_INFINITY)).toBe(false);
  });

  it("throws for invalid lane counts", () => {
    expect(() => assertValidLaneCount(0)).toThrow(RangeError);
    expect(() => assertValidLaneCount(-1)).toThrow(RangeError);
    expect(() => assertValidLaneCount(1.5)).toThrow(RangeError);
    expect(() => assertValidLaneCount(Number.NaN)).toThrow(RangeError);
  });

  it("normalizes lane counts for future scenario inputs", () => {
    expect(normalizeLaneCount(1)).toBe(1);
    expect(normalizeLaneCount(3)).toBe(3);
    expect(normalizeLaneCount(3.9)).toBe(3);

    expect(normalizeLaneCount(0)).toBe(DEFAULT_ROAD_LANE_COUNT);
    expect(normalizeLaneCount(-5)).toBe(DEFAULT_ROAD_LANE_COUNT);
    expect(normalizeLaneCount(Number.NaN)).toBe(DEFAULT_ROAD_LANE_COUNT);
  });

  it("uses a custom fallback when normalizing invalid values", () => {
    expect(normalizeLaneCount(0, 2)).toBe(2);
    expect(normalizeLaneCount(Number.POSITIVE_INFINITY, 4)).toBe(4);
  });

  it("rejects invalid fallback lane counts", () => {
    expect(() => normalizeLaneCount(0, 0)).toThrow(RangeError);
    expect(() => normalizeLaneCount(0, -1)).toThrow(RangeError);
    expect(() => normalizeLaneCount(0, 1.5)).toThrow(RangeError);
  });

  it("derives lane width from lane count", () => {
    const road = {
      centerX: 400,
      width: 360,
      laneCount: 3,
      topY: 0,
      bottomY: 900,
    };

    expect(getLaneWidth(road)).toBe(120);
  });

  it("derives divider count from lane count", () => {
    expect(getLaneDividerCount(1)).toBe(0);
    expect(getLaneDividerCount(2)).toBe(1);
    expect(getLaneDividerCount(3)).toBe(2);
    expect(getLaneDividerCount(4)).toBe(3);
  });

  it("creates no lane divider lines for a one-lane road", () => {
    const road = {
      centerX: 400,
      width: 360,
      laneCount: 1,
      topY: 0,
      bottomY: 900,
    };

    expect(getLaneDividerLines(road)).toEqual([]);
  });

  it("creates laneCount - 1 divider lines", () => {
    const road = createInitialRoad();

    expect(getLaneDividerLines(road)).toHaveLength(road.laneCount - 1);
  });
});

describe("lane center calculations", () => {
  it("calculates lane width from road width and lane count", () => {
    const road = createInitialRoad();

    expect(getLaneWidth(road)).toBe(120);
  });

  it("calculates lane centers for the default three-lane road", () => {
    const road = createInitialRoad();

    expect(getLaneCenterX(road, 0)).toBe(280);
    expect(getLaneCenterX(road, 1)).toBe(400);
    expect(getLaneCenterX(road, 2)).toBe(520);
  });

  it("uses zero-based indexing with lane 0 as the leftmost lane", () => {
    const road = createInitialRoad();

    expect(getLaneLeftEdgeX(road, 0)).toBe(220);
    expect(getLaneRightEdgeX(road, 0)).toBe(340);
    expect(getLaneCenterX(road, 0)).toBe(280);
  });

  it("uses laneCount - 1 as the rightmost lane", () => {
    const road = createInitialRoad();
    const rightmostLaneIndex = road.laneCount - 1;

    expect(rightmostLaneIndex).toBe(2);
    expect(getLaneLeftEdgeX(road, rightmostLaneIndex)).toBe(460);
    expect(getLaneRightEdgeX(road, rightmostLaneIndex)).toBe(580);
    expect(getLaneCenterX(road, rightmostLaneIndex)).toBe(520);
  });

  it("returns complete lane geometry", () => {
    const road = createInitialRoad();

    expect(getLaneGeometry(road, 1)).toEqual({
      laneIndex: 1,
      centerX: 400,
      width: 120,
      leftEdgeX: 340,
      rightEdgeX: 460,
    });
  });

  it("returns all lane geometries from left to right", () => {
    const road = createInitialRoad();

    expect(getAllLaneGeometries(road)).toEqual([
      {
        laneIndex: 0,
        centerX: 280,
        width: 120,
        leftEdgeX: 220,
        rightEdgeX: 340,
      },
      {
        laneIndex: 1,
        centerX: 400,
        width: 120,
        leftEdgeX: 340,
        rightEdgeX: 460,
      },
      {
        laneIndex: 2,
        centerX: 520,
        width: 120,
        leftEdgeX: 460,
        rightEdgeX: 580,
      },
    ]);
  });

  it("calculates the default starting lane for odd lane counts", () => {
    const road = createInitialRoad();

    expect(getDefaultStartLaneIndex(road)).toBe(1);
    expect(getDefaultStartLaneCenterX(road)).toBe(400);
  });

  it("calculates the default starting lane for even lane counts", () => {
    const road = {
      centerX: 400,
      width: 400,
      laneCount: 4,
      topY: 0,
      bottomY: 900,
    };

    expect(getDefaultStartLaneIndex(road)).toBe(1);
    expect(getDefaultStartLaneCenterX(road)).toBe(350);
  });

  it("supports a one-lane road", () => {
    const road = {
      centerX: 400,
      width: 360,
      laneCount: 1,
      topY: 0,
      bottomY: 900,
    };

    expect(getLaneWidth(road)).toBe(360);
    expect(getLaneCenterX(road, 0)).toBe(400);
    expect(getDefaultStartLaneIndex(road)).toBe(0);
  });

  it("supports fractional lane widths", () => {
    const road = {
      centerX: 100,
      width: 100,
      laneCount: 3,
      topY: 0,
      bottomY: 900,
    };

    expect(getLaneWidth(road)).toBeCloseTo(33.333333);
    expect(getLaneCenterX(road, 0)).toBeCloseTo(66.666666);
    expect(getLaneCenterX(road, 1)).toBeCloseTo(100);
    expect(getLaneCenterX(road, 2)).toBeCloseTo(133.333333);
  });

  it("validates lane indexes", () => {
    const road = createInitialRoad();

    expect(isValidLaneIndex(road, 0)).toBe(true);
    expect(isValidLaneIndex(road, 1)).toBe(true);
    expect(isValidLaneIndex(road, 2)).toBe(true);

    expect(isValidLaneIndex(road, -1)).toBe(false);
    expect(isValidLaneIndex(road, 3)).toBe(false);
    expect(isValidLaneIndex(road, 1.5)).toBe(false);
  });

  it("rejects invalid lane indexes safely", () => {
    const road = createInitialRoad();

    expect(() => getLaneCenterX(road, -1)).toThrow(RangeError);
    expect(() => getLaneCenterX(road, road.laneCount)).toThrow(RangeError);
    expect(() => getLaneCenterX(road, 1.5)).toThrow(RangeError);
    expect(() => getLaneCenterX(road, Number.NaN)).toThrow(RangeError);
  });
});
