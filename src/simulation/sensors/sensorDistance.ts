/**
 * Sensor distance calculation helpers for AutoDrive ReactLab.
 *
 * This module converts already-generated ray geometry and already-detected hit
 * candidates into safe distance values and SensorReading objects.
 *
 * Responsibility:
 * - Calculate ray length.
 * - Calculate hit distance from ray start.
 * - Normalize distances into the range [0, 1].
 * - Convert normalized distances into dashboard-friendly percentages.
 * - Create explicit no-detection readings.
 * - Select the nearest valid detection candidate for a ray.
 *
 * This module intentionally does not:
 * - Generate rays.
 * - Detect intersections.
 * - Render sensor overlays.
 * - Read from Zustand.
 * - Update CarState.
 * - Make AI decisions.
 *
 * Distance convention:
 * - Distances use simulation world/canvas units.
 * - Distance is measured from ray.start.
 * - 0 means nearest.
 * - 1 normalized / 100% means farthest.
 */

import type {
  SensorDetectionType,
  SensorPoint,
  SensorRay,
  SensorReading,
} from "./sensorModel";
import {
  createDetectedSensorReading,
  createNoDetectionSensorReading,
  createSensorPoint,
} from "./sensorModel";

/**
 * Small tolerance used to handle harmless floating-point drift near boundaries.
 *
 * This must not be used to silently accept clearly invalid geometry.
 */
export const SENSOR_DISTANCE_EPSILON = 1e-9;

/**
 * A candidate detection point for one sensor ray.
 *
 * Candidates are produced by detection modules such as road-edge detection,
 * obstacle detection, or future traffic-light detection.
 */
export interface SensorDetectionCandidate {
  /** Type of object or boundary detected. */
  readonly detectionType: SensorDetectionType;

  /** World-space point where the candidate detection occurred. */
  readonly point: SensorPoint;
}

/**
 * Dashboard/telemetry-friendly summary of one detected hit distance.
 */
export interface SensorDistanceSummary {
  /** Raw distance from ray.start to the hit point in world units. */
  readonly rawDistance: number;

  /**
   * Distance normalized against ray.maxLength.
   *
   * Semantics:
   * - 0 = nearest
   * - 1 = farthest
   */
  readonly normalizedDistance: number;

  /**
   * Normalized distance expressed as a percentage.
   *
   * Semantics:
   * - 0% = nearest
   * - 100% = farthest
   */
  readonly percentage: number;
}

/**
 * Asserts that a point contains finite world-space coordinates.
 */
function assertFinitePoint(point: SensorPoint, label: string): void {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    throw new RangeError(`${label} must contain finite world-space coordinates.`);
  }
}

/**
 * Asserts that a ray is safe for distance calculations.
 */
function assertValidRay(ray: SensorRay): void {
  assertFinitePoint(ray.start, "ray.start");
  assertFinitePoint(ray.end, "ray.end");

  if (!Number.isInteger(ray.index) || ray.index < 0) {
    throw new RangeError("ray.index must be a non-negative integer.");
  }

  if (!Number.isFinite(ray.maxLength) || ray.maxLength <= 0) {
    throw new RangeError("ray.maxLength must be a finite positive value.");
  }
}

/**
 * Clamps a value into [0, 1] only when it is slightly outside the range due to
 * floating-point drift.
 */
function clampUnitInterval(value: number): number {
  if (value < 0 && value >= -SENSOR_DISTANCE_EPSILON) {
    return 0;
  }

  if (value > 1 && value <= 1 + SENSOR_DISTANCE_EPSILON) {
    return 1;
  }

  return value;
}

/**
 * Calculates Euclidean distance between two world-space points.
 */
export function calculatePointDistance(start: SensorPoint, end: SensorPoint): number {
  assertFinitePoint(start, "start");
  assertFinitePoint(end, "end");

  return Math.hypot(end.x - start.x, end.y - start.y);
}

/**
 * Calculates the geometric length of a sensor ray.
 *
 * This uses ray.start and ray.end, not ray.maxLength directly. In normal valid
 * ray generation these values should match, but calculating the geometry is
 * useful for validation, tests, and debugging.
 */
export function calculateRayLength(ray: SensorRay): number {
  assertValidRay(ray);

  return calculatePointDistance(ray.start, ray.end);
}

/**
 * Calculates distance from the ray origin to a detection point.
 */
export function calculateHitDistance(ray: SensorRay, hitPoint: SensorPoint): number {
  assertValidRay(ray);
  assertFinitePoint(hitPoint, "hitPoint");

  return calculatePointDistance(ray.start, hitPoint);
}

/**
 * Normalizes a raw distance against a maximum ray length.
 *
 * Formula:
 *
 * normalizedDistance = distance / maxLength
 *
 * Semantics:
 * - 0 = nearest
 * - 1 = farthest
 */
export function normalizeDistance(distance: number, maxLength: number): number {
  if (!Number.isFinite(distance) || distance < 0) {
    throw new RangeError("distance must be a finite non-negative value.");
  }

  if (!Number.isFinite(maxLength) || maxLength <= 0) {
    throw new RangeError("maxLength must be a finite positive value.");
  }

  if (distance > maxLength + SENSOR_DISTANCE_EPSILON) {
    throw new RangeError("distance must not exceed maxLength.");
  }

  return clampUnitInterval(distance / maxLength);
}

/**
 * Converts a normalized distance into a dashboard-friendly percentage.
 *
 * Formula:
 *
 * percentage = normalizedDistance * 100
 *
 * Semantics:
 * - 0% = nearest
 * - 100% = farthest
 */
export function distanceToPercentage(normalizedDistance: number): number {
  if (!Number.isFinite(normalizedDistance)) {
    throw new RangeError("normalizedDistance must be finite.");
  }

  if (
    normalizedDistance < -SENSOR_DISTANCE_EPSILON ||
    normalizedDistance > 1 + SENSOR_DISTANCE_EPSILON
  ) {
    throw new RangeError("normalizedDistance must be between 0 and 1.");
  }

  return clampUnitInterval(normalizedDistance) * 100;
}

/**
 * Creates a raw, normalized, and percentage distance summary for a detected hit.
 */
export function summarizeHitDistance(
  ray: SensorRay,
  hitPoint: SensorPoint,
): SensorDistanceSummary {
  const rawDistance = calculateHitDistance(ray, hitPoint);
  const normalizedDistance = normalizeDistance(rawDistance, ray.maxLength);

  return {
    rawDistance,
    normalizedDistance,
    percentage: distanceToPercentage(normalizedDistance),
  };
}

/**
 * Returns true when a detection candidate lies within the ray's maximum range.
 */
export function isCandidateWithinRayRange(
  ray: SensorRay,
  candidate: SensorDetectionCandidate,
): boolean {
  assertValidRay(ray);
  assertFinitePoint(candidate.point, "candidate.point");

  const distance = calculateHitDistance(ray, candidate.point);

  return distance <= ray.maxLength + SENSOR_DISTANCE_EPSILON;
}

/**
 * Converts one optional candidate into a SensorReading.
 *
 * Rules:
 * - null candidate -> explicit no-detection reading
 * - candidate beyond ray range -> explicit no-detection reading
 * - valid candidate -> detected reading
 */
export function createSensorReadingFromCandidate(
  ray: SensorRay,
  candidate: SensorDetectionCandidate | null,
): SensorReading {
  assertValidRay(ray);

  if (candidate === null) {
    return createNoDetectionSensorReading(ray.index);
  }

  assertFinitePoint(candidate.point, "candidate.point");

  const distance = calculateHitDistance(ray, candidate.point);

  if (distance > ray.maxLength + SENSOR_DISTANCE_EPSILON) {
    return createNoDetectionSensorReading(ray.index);
  }

  return createDetectedSensorReading({
    rayIndex: ray.index,
    detectionType: candidate.detectionType,
    distance: clampUnitInterval(distance / ray.maxLength) * ray.maxLength,
    point: createSensorPoint(candidate.point.x, candidate.point.y),
  });
}

/**
 * Selects the nearest valid detection candidate for a ray.
 *
 * Candidates beyond the ray maximum range are ignored.
 *
 * If no candidate is within range, returns null.
 */
export function selectNearestDetectionCandidate(
  ray: SensorRay,
  candidates: readonly SensorDetectionCandidate[],
): SensorDetectionCandidate | null {
  assertValidRay(ray);

  let nearest: SensorDetectionCandidate | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const candidate of candidates) {
    assertFinitePoint(candidate.point, "candidate.point");

    const distance = calculateHitDistance(ray, candidate.point);

    if (distance > ray.maxLength + SENSOR_DISTANCE_EPSILON) {
      continue;
    }

    if (distance < nearestDistance) {
      nearest = candidate;
      nearestDistance = distance;
    }
  }

  return nearest;
}

/**
 * Creates the nearest SensorReading for a ray from a list of detection
 * candidates.
 *
 * This is the main helper future sensor update loops can use after collecting
 * candidate hits from road edges, obstacles, lane boundaries, and other systems.
 */
export function createNearestSensorReading(
  ray: SensorRay,
  candidates: readonly SensorDetectionCandidate[],
): SensorReading {
  const nearest = selectNearestDetectionCandidate(ray, candidates);

  return createSensorReadingFromCandidate(ray, nearest);
}
