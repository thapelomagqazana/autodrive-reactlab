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

export const DEFAULT_ROAD_CENTER_X = 400;
export const DEFAULT_ROAD_WIDTH = 360;

export const DEFAULT_ROAD: Readonly<Road> = Object.freeze({
  centerX: DEFAULT_ROAD_CENTER_X,
  width: DEFAULT_ROAD_WIDTH,
  laneCount: 3,
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

  if (!isValidLaneCount(road.laneCount)) {
    throw new RangeError("road.laneCount must be a positive integer.");
  }

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
 * Returns the width of one lane in pixels.
 */
export function getLaneWidth(road: Road): number {
  assertValidRoad(road);

  return road.width / road.laneCount;
}

/**
 * Returns the center X coordinate for a zero-based lane index.
 *
 * laneIndex = 0 means the leftmost lane.
 */
export function getLaneCenterX(road: Road, laneIndex: number): number {
  assertValidRoad(road);

  if (!Number.isInteger(laneIndex)) {
    throw new RangeError("laneIndex must be an integer.");
  }

  if (laneIndex < 0 || laneIndex >= road.laneCount) {
    throw new RangeError("laneIndex must be within the road lane range.");
  }

  return getRoadLeftEdgeX(road) + getLaneWidth(road) * (laneIndex + 0.5);
}

/**
 * Creates visual and future-sensor boundary lines for road edges.
 */
export function getRoadBoundaryLines(road: Road): RoadLine[] {
  assertValidRoad(road);

  const leftEdgeX = getRoadLeftEdgeX(road);
  const rightEdgeX = getRoadRightEdgeX(road);

  return [
    {
      startX: leftEdgeX,
      startY: road.topY,
      endX: leftEdgeX,
      endY: road.bottomY,
      kind: "boundary",
    },
    {
      startX: rightEdgeX,
      startY: road.topY,
      endX: rightEdgeX,
      endY: road.bottomY,
      kind: "boundary",
    },
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

  const laneWidth = getLaneWidth(road);
  const leftEdgeX = getRoadLeftEdgeX(road);
  const dividerCount = road.laneCount - 1;

  return Array.from({ length: dividerCount }, (_, index) => {
    const dividerX = leftEdgeX + laneWidth * (index + 1);

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
