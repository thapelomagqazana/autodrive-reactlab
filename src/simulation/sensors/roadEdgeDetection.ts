/**
 * Road-edge intersection detection for AutoDrive ReactLab sensor rays.
 *
 * This module performs pure finite-segment geometry checks between generated
 * sensor rays and road boundary segments.
 *
 * Responsibility:
 * - Represent road boundaries as finite line segments.
 * - Calculate finite segment intersections.
 * - Detect the closest road-boundary hit for a sensor ray.
 * - Return road-boundary detection metadata for later conversion into readings.
 *
 * This module intentionally does not:
 * - Generate sensor rays.
 * - Render sensor overlays.
 * - Update CarState.
 * - Read from Zustand.
 * - Make AI decisions.
 * - Perform collision response.
 *
 * Coordinate convention:
 * - Coordinates are world/canvas coordinates.
 * - Positive X moves right.
 * - Positive Y moves down.
 */

import type { SensorDetectionType, SensorPoint, SensorRay } from "./sensorModel";
import { createSensorPoint } from "./sensorModel";

/**
 * Small tolerance used for floating-point comparisons.
 *
 * Geometry calculations can produce tiny rounding errors, especially when
 * checking whether an intersection lies exactly on a segment endpoint.
 */
export const ROAD_EDGE_INTERSECTION_EPSILON = 1e-9;

/**
 * Supported road boundary side labels.
 *
 * These values let downstream systems distinguish whether a ray detected the
 * left or right road edge.
 */
export type RoadBoundarySide = "left" | "right";

/**
 * A finite line segment in world-space coordinates.
 */
export interface LineSegment {
  /** Segment start point. */
  readonly start: SensorPoint;

  /** Segment end point. */
  readonly end: SensorPoint;
}

/**
 * A detectable road boundary segment.
 *
 * The side label identifies whether the boundary belongs to the left or right
 * edge of the road.
 */
export interface RoadBoundarySegment extends LineSegment {
  /** Road boundary side represented by this segment. */
  readonly side: RoadBoundarySide;
}

/**
 * Result of intersecting two finite line segments.
 */
export interface SegmentIntersection {
  /** World-space intersection point. */
  readonly point: SensorPoint;

  /**
   * Normalized offset along the first segment.
   *
   * Semantics:
   * - 0 means the first segment start point.
   * - 1 means the first segment end point.
   */
  readonly offsetOnFirstSegment: number;

  /**
   * Normalized offset along the second segment.
   *
   * Semantics:
   * - 0 means the second segment start point.
   * - 1 means the second segment end point.
   */
  readonly offsetOnSecondSegment: number;
}

/**
 * Road-edge detection result for one sensor ray.
 */
export interface RoadEdgeIntersection {
  /** Detection category. Always road-boundary for this module. */
  readonly detectionType: Extract<SensorDetectionType, "road-boundary">;

  /** Which road boundary side was detected. */
  readonly boundarySide: RoadBoundarySide;

  /** World-space point where the ray intersects the boundary. */
  readonly point: SensorPoint;

  /** Distance from ray.start to the intersection point in world units. */
  readonly distance: number;

  /**
   * Distance normalized against ray.maxLength.
   *
   * Semantics:
   * - 0 means the hit is at the ray start.
   * - 1 means the hit is at the ray maximum range.
   */
  readonly normalizedOffset: number;

  /** Index of the sensor ray that produced this hit. */
  readonly rayIndex: number;
}

/**
 * Asserts that a world-space point contains finite coordinates.
 */
function assertFinitePoint(point: SensorPoint, label: string): void {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    throw new RangeError(`${label} must contain finite world-space coordinates.`);
  }
}

/**
 * Asserts that a line segment has valid finite, non-identical endpoints.
 */
function assertValidSegment(segment: LineSegment, label: string): void {
  assertFinitePoint(segment.start, `${label}.start`);
  assertFinitePoint(segment.end, `${label}.end`);

  if (
    Math.abs(segment.start.x - segment.end.x) <= ROAD_EDGE_INTERSECTION_EPSILON &&
    Math.abs(segment.start.y - segment.end.y) <= ROAD_EDGE_INTERSECTION_EPSILON
  ) {
    throw new RangeError(`${label} must not be a zero-length segment.`);
  }
}

/**
 * Asserts that a sensor ray can safely participate in intersection detection.
 */
function assertValidRay(ray: SensorRay): void {
  assertValidSegment({ start: ray.start, end: ray.end }, "ray");

  if (!Number.isInteger(ray.index) || ray.index < 0) {
    throw new RangeError("ray.index must be a non-negative integer.");
  }

  if (!Number.isFinite(ray.maxLength) || ray.maxLength <= 0) {
    throw new RangeError("ray.maxLength must be a finite positive value.");
  }
}

/**
 * Calculates the 2D cross product of two vectors.
 *
 * This is used to determine whether two line segments are parallel and to solve
 * parametric segment intersection.
 */
function cross(ax: number, ay: number, bx: number, by: number): number {
  return ax * by - ay * bx;
}

/**
 * Calculates Euclidean distance between two world-space points.
 */
function distanceBetween(start: SensorPoint, end: SensorPoint): number {
  return Math.hypot(end.x - start.x, end.y - start.y);
}

/**
 * Returns true when a parametric segment offset is inside [0, 1], allowing a
 * small epsilon for floating-point drift.
 */
function isWithinUnitInterval(value: number): boolean {
  return (
    value >= -ROAD_EDGE_INTERSECTION_EPSILON &&
    value <= 1 + ROAD_EDGE_INTERSECTION_EPSILON
  );
}

/**
 * Clamps a near-boundary parametric value into [0, 1].
 *
 * This should only correct tiny floating-point drift, not invalid geometry.
 */
function clampUnitInterval(value: number): number {
  if (value < 0 && value >= -ROAD_EDGE_INTERSECTION_EPSILON) {
    return 0;
  }

  if (value > 1 && value <= 1 + ROAD_EDGE_INTERSECTION_EPSILON) {
    return 1;
  }

  return value;
}

/**
 * Calculates the intersection between two finite line segments.
 *
 * The function uses a standard parametric segment intersection formula:
 *
 * first(t) = first.start + t * (first.end - first.start)
 * second(u) = second.start + u * (second.end - second.start)
 *
 * A valid intersection requires:
 * - t inside [0, 1]
 * - u inside [0, 1]
 *
 * Returns:
 * - intersection point and segment offsets when the segments intersect
 * - null when they do not intersect within their finite ranges
 *
 * Collinear overlapping segments intentionally return null for now because road
 * edge detection only needs crossing-style ray-to-boundary intersections.
 */
export function getIntersection(
  first: LineSegment,
  second: LineSegment,
): SegmentIntersection | null {
  assertValidSegment(first, "first segment");
  assertValidSegment(second, "second segment");

  const p = first.start;
  const q = second.start;

  const r = {
    x: first.end.x - first.start.x,
    y: first.end.y - first.start.y,
  };

  const s = {
    x: second.end.x - second.start.x,
    y: second.end.y - second.start.y,
  };

  const denominator = cross(r.x, r.y, s.x, s.y);

  // Parallel or collinear segments have no single crossing point in this module.
  if (Math.abs(denominator) <= ROAD_EDGE_INTERSECTION_EPSILON) {
    return null;
  }

  const qMinusP = {
    x: q.x - p.x,
    y: q.y - p.y,
  };

  const t = cross(qMinusP.x, qMinusP.y, s.x, s.y) / denominator;
  const u = cross(qMinusP.x, qMinusP.y, r.x, r.y) / denominator;

  // If either offset is outside [0, 1], the infinite lines cross outside at
  // least one of the finite segments.
  if (!isWithinUnitInterval(t) || !isWithinUnitInterval(u)) {
    return null;
  }

  const safeT = clampUnitInterval(t);
  const safeU = clampUnitInterval(u);

  return {
    point: createSensorPoint(p.x + safeT * r.x, p.y + safeT * r.y),
    offsetOnFirstSegment: safeT,
    offsetOnSecondSegment: safeU,
  };
}

/**
 * Detects the closest road-boundary intersection for a finite sensor ray.
 *
 * The sensor ray is treated as a finite segment from `ray.start` to `ray.end`.
 * Boundary segments are also finite.
 *
 * If multiple road boundaries are intersected by the same ray, the closest
 * intersection to `ray.start` wins.
 *
 * Returns null when no valid boundary intersection exists.
 */
export function detectClosestRoadEdgeIntersection(
  ray: SensorRay,
  boundaries: readonly RoadBoundarySegment[],
): RoadEdgeIntersection | null {
  assertValidRay(ray);

  let closest: RoadEdgeIntersection | null = null;

  for (const boundary of boundaries) {
    assertValidSegment(boundary, `${boundary.side} road boundary`);

    const intersection = getIntersection({ start: ray.start, end: ray.end }, boundary);

    if (intersection === null) {
      continue;
    }

    const distance = distanceBetween(ray.start, intersection.point);

    // Defensive guard: getIntersection already treats the ray as finite, but this
    // protects against inconsistent ray.end/maxLength values.
    if (distance > ray.maxLength + ROAD_EDGE_INTERSECTION_EPSILON) {
      continue;
    }

    const normalizedOffset = clampUnitInterval(distance / ray.maxLength);

    const result: RoadEdgeIntersection = {
      detectionType: "road-boundary",
      boundarySide: boundary.side,
      point: intersection.point,
      distance,
      normalizedOffset,
      rayIndex: ray.index,
    };

    if (closest === null || result.distance < closest.distance) {
      closest = result;
    }
  }

  return closest;
}
