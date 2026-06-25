/**
 * Road domain model for AutoDrive ReactLab.
 *
 * This module defines the canonical straight-road model for the Phase 1 MVP.
 *
 * Coordinate system:
 * - Units are canvas pixels.
 * - Origin is the top-left of the canvas.
 * - Positive X moves right.
 * - Positive Y moves down.
 *
 * Design rules:
 * - Road data owns layout.
 * - Renderers consume road data.
 * - Physics and sensors may consume road geometry later.
 * - No React, Zustand, Canvas API, or DOM imports belong in this file.
 */

export type RoadLineKind = "boundary" | "divider";

/**
 * A straight 2D line segment in canvas/world coordinates.
 */
export interface RoadLine {
  /** Horizontal start coordinate in pixels. */
  startX: number;

  /** Vertical start coordinate in pixels. */
  startY: number;

  /** Horizontal end coordinate in pixels. */
  endX: number;

  /** Vertical end coordinate in pixels. */
  endY: number;

  /** Semantic purpose of the line. */
  kind: RoadLineKind;
}

/**
 * Horizontal position and width of a road.
 *
 * This smaller interface makes road layout helpers reusable by future scenario
 * systems that may only need the road's horizontal geometry.
 */
export interface RoadHorizontalGeometry {
  /** Horizontal center of the road in pixels. */
  centerX: number;

  /** Total road width in pixels. Must be greater than zero. */
  width: number;
}

export interface Road extends RoadHorizontalGeometry {
  /** Number of lanes on the road. Must be a positive integer. */
  laneCount: number;

  /** Top Y coordinate of the road in pixels. */
  topY: number;

  /** Bottom Y coordinate of the road in pixels. */
  bottomY: number;
}

export interface LaneGeometry {
  /** Zero-based lane index. */
  laneIndex: number;

  /** Horizontal center of the lane in pixels. */
  centerX: number;

  /** Lane width in pixels. */
  width: number;

  /** Left edge of the lane in pixels. */
  leftEdgeX: number;

  /** Right edge of the lane in pixels. */
  rightEdgeX: number;
}

export const DEFAULT_ROAD_CENTER_X = 400;
export const DEFAULT_ROAD_WIDTH = 360;

/**
 * Default MVP lane count.
 *
 * Three lanes are useful for MVP because the middle lane gives a clear default
 * car starting lane, while side lanes make lane-center calculations visible.
 */
export const DEFAULT_ROAD_LANE_COUNT = 3;

export const DEFAULT_ROAD: Readonly<Road> = Object.freeze({
  centerX: DEFAULT_ROAD_CENTER_X,
  width: DEFAULT_ROAD_WIDTH,
  laneCount: DEFAULT_ROAD_LANE_COUNT,
  topY: -2000,
  bottomY: 900,
});

/**
 * Creates a fresh road model for the default MVP scenario.
 */
export function createInitialRoad(): Road {
  return {
    ...DEFAULT_ROAD,
  };
}

/**
 * Returns true when a number is safe for road layout calculations.
 */
export function isFiniteRoadNumber(value: number): boolean {
  return Number.isFinite(value);
}

/**
 * Returns true when a road width is valid.
 *
 * Width must be finite and greater than zero.
 */
export function isValidRoadWidth(width: number): boolean {
  return Number.isFinite(width) && width > 0;
}

/**
 * Returns true when a value is a valid positive road size.
 */
export function isPositiveRoadSize(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

/**
 * Returns true when lane count is usable for layout.
 */
export function isValidLaneCount(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

/**
 * Asserts that a lane count is valid.
 */
export function assertValidLaneCount(laneCount: number): void {
  if (!isValidLaneCount(laneCount)) {
    throw new RangeError("laneCount must be a positive integer.");
  }
}

/**
 * Returns true when the lane index exists on the road.
 */
export function isValidLaneIndex(road: Road, laneIndex: number): boolean {
  assertValidRoad(road);

  return Number.isInteger(laneIndex) && laneIndex >= 0 && laneIndex < road.laneCount;
}

/**
 * Asserts that the lane index exists on the road.
 */
export function assertValidLaneIndex(road: Road, laneIndex: number): void {
  if (!isValidLaneIndex(road, laneIndex)) {
    throw new RangeError(
      `laneIndex must be an integer between 0 and ${road.laneCount - 1}.`,
    );
  }
}

/**
 * Normalizes user/scenario input into a valid lane count.
 *
 * This is useful for future scenario editors or imported JSON.
 *
 * Rule:
 * - finite positive numbers are floored
 * - values below 1 become fallback
 * - invalid values become fallback
 */
export function normalizeLaneCount(
  value: number,
  fallback = DEFAULT_ROAD_LANE_COUNT,
): number {
  assertValidLaneCount(fallback);

  if (!Number.isFinite(value) || value < 1) {
    return fallback;
  }

  return Math.floor(value);
}

/**
 * Returns the number of lane divider lines required.
 *
 * Divider count is always laneCount - 1.
 */
export function getLaneDividerCount(laneCount: number): number {
  assertValidLaneCount(laneCount);

  return laneCount - 1;
}

/**
 * Validates only the horizontal road geometry.
 *
 * This is useful for helpers that only require centerX and width.
 */
export function assertValidRoadHorizontalGeometry(
  geometry: RoadHorizontalGeometry,
): void {
  if (!isFiniteRoadNumber(geometry.centerX)) {
    throw new RangeError("road.centerX must be a finite pixel coordinate.");
  }

  if (!isValidRoadWidth(geometry.width)) {
    throw new RangeError("road.width must be a finite positive pixel width.");
  }
}

/**
 * Validates road model invariants.
 */
export function assertValidRoad(road: Road): void {
  assertValidRoadHorizontalGeometry(road);
  assertValidLaneCount(road.laneCount);

  if (!isFiniteRoadNumber(road.topY)) {
    throw new RangeError("road.topY must be finite.");
  }

  if (!isFiniteRoadNumber(road.bottomY)) {
    throw new RangeError("road.bottomY must be finite.");
  }

  if (road.bottomY <= road.topY) {
    throw new RangeError("road.bottomY must be greater than road.topY.");
  }
}

/**
 * Returns the left road edge X coordinate.
 */
export function getRoadLeftEdgeX(geometry: RoadHorizontalGeometry): number {
  assertValidRoadHorizontalGeometry(geometry);

  return geometry.centerX - geometry.width / 2;
}

/**
 * Returns the right road edge X coordinate.
 */
export function getRoadRightEdgeX(geometry: RoadHorizontalGeometry): number {
  assertValidRoadHorizontalGeometry(geometry);

  return geometry.centerX + geometry.width / 2;
}

/**
 * Returns both horizontal road edges as derived values.
 */
export function getRoadHorizontalEdges(geometry: RoadHorizontalGeometry): {
  leftEdgeX: number;
  rightEdgeX: number;
} {
  return {
    leftEdgeX: getRoadLeftEdgeX(geometry),
    rightEdgeX: getRoadRightEdgeX(geometry),
  };
}

/**
 * Creates a road boundary line from one edge X coordinate.
 *
 * Keeping this as a helper makes boundary generation consistent and testable.
 */
export function createRoadBoundaryLine(
  edgeX: number,
  topY: number,
  bottomY: number,
): RoadLine {
  if (!isFiniteRoadNumber(edgeX)) {
    throw new RangeError("edgeX must be finite.");
  }

  if (!isFiniteRoadNumber(topY)) {
    throw new RangeError("topY must be finite.");
  }

  if (!isFiniteRoadNumber(bottomY)) {
    throw new RangeError("bottomY must be finite.");
  }

  if (bottomY <= topY) {
    throw new RangeError("bottomY must be greater than topY.");
  }

  return {
    startX: edgeX,
    startY: topY,
    endX: edgeX,
    endY: bottomY,
    kind: "boundary",
  };
}

/**
 * Returns the width of one lane in pixels.
 */
export function getLaneWidth(road: Road): number {
  assertValidRoad(road);

  return road.width / road.laneCount;
}

/**
 * Returns the left edge X position for a zero-based lane index.
 */
export function getLaneLeftEdgeX(road: Road, laneIndex: number): number {
  assertValidLaneIndex(road, laneIndex);

  return getRoadLeftEdgeX(road) + getLaneWidth(road) * laneIndex;
}

/**
 * Returns the right edge X position for a zero-based lane index.
 */
export function getLaneRightEdgeX(road: Road, laneIndex: number): number {
  assertValidLaneIndex(road, laneIndex);

  return getLaneLeftEdgeX(road, laneIndex) + getLaneWidth(road);
}

/**
 * Returns the center X coordinate for a zero-based lane index.
 *
 * laneIndex = 0 means the leftmost lane.
 */
export function getLaneCenterX(road: Road, laneIndex: number): number {
  assertValidLaneIndex(road, laneIndex);

  return getLaneLeftEdgeX(road, laneIndex) + getLaneWidth(road) / 2;
}

/**
 * Returns complete geometry for one lane.
 */
export function getLaneGeometry(road: Road, laneIndex: number): LaneGeometry {
  assertValidLaneIndex(road, laneIndex);

  return {
    laneIndex,
    centerX: getLaneCenterX(road, laneIndex),
    width: getLaneWidth(road),
    leftEdgeX: getLaneLeftEdgeX(road, laneIndex),
    rightEdgeX: getLaneRightEdgeX(road, laneIndex),
  };
}

/**
 * Returns geometry for every lane from left to right.
 */
export function getAllLaneGeometries(road: Road): LaneGeometry[] {
  assertValidRoad(road);

  return Array.from({ length: road.laneCount }, (_, laneIndex) =>
    getLaneGeometry(road, laneIndex),
  );
}

/**
 * Returns the default starting lane index.
 *
 * For odd lane counts, this is the true center lane.
 * For even lane counts, this chooses the left-middle lane for determinism.
 */
export function getDefaultStartLaneIndex(road: Road): number {
  assertValidRoad(road);

  return Math.floor((road.laneCount - 1) / 2);
}

/**
 * Returns the default starting lane center X position.
 *
 * Car spawning should use this instead of hardcoded X coordinates.
 */
export function getDefaultStartLaneCenterX(road: Road): number {
  return getLaneCenterX(road, getDefaultStartLaneIndex(road));
}

/**
 * Returns boundary line data for the left and right road edges.
 *
 * Order:
 * 1. Left boundary
 * 2. Right boundary
 */
export function getRoadBoundaryLines(road: Road): RoadLine[] {
  assertValidRoad(road);

  const { leftEdgeX, rightEdgeX } = getRoadHorizontalEdges(road);

  return [
    createRoadBoundaryLine(leftEdgeX, road.topY, road.bottomY),
    createRoadBoundaryLine(rightEdgeX, road.topY, road.bottomY),
  ];
}

/**
 * Creates lane divider lines between lanes.
 *
 * For laneCount = 1, no divider lines are returned.
 * For laneCount = 3, two divider lines are returned.
 */
export function getLaneDividerLines(road: Road): RoadLine[] {
  assertValidRoad(road);

  const dividerCount = getLaneDividerCount(road.laneCount);

  return Array.from({ length: dividerCount }, (_, index) => {
    const dividerX = getLaneRightEdgeX(road, index);

    return {
      startX: dividerX,
      startY: road.topY,
      endX: dividerX,
      endY: road.bottomY,
      kind: "divider",
    };
  });
}

/**
 * Returns all road lines in semantic render order.
 */
export function getRoadLines(road: Road): RoadLine[] {
  return [...getRoadBoundaryLines(road), ...getLaneDividerLines(road)];
}
