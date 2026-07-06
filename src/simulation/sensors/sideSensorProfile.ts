/**
 * Side-facing sensor ray profile for AutoDrive ReactLab.
 *
 * This module defines the left and right side sensor layout used by the car.
 * It does not perform object detection, collision detection, rendering,
 * dashboard updates, or AI decision-making.
 *
 * Responsibility:
 * - Define side sensor labels.
 * - Derive side sensor length from the front sensor range.
 * - Generate deterministic side ray geometry.
 * - Group side rays into left, right, and combined collections.
 *
 * Coordinate convention:
 * - Positions use world/canvas coordinates.
 * - Positive X moves right.
 * - Positive Y moves down.
 *
 * Angle convention:
 * - Angles are radians.
 * - 0 radians means the car faces upward/north.
 * - Positive rotation is clockwise.
 */

import type { CarState } from "../vehicle/carState";
import type { SensorConfig, SensorRay } from "./sensorModel";
import { createSensorConfig, createSensorPoint } from "./sensorModel";
import { castRay } from "./raycasting";

/**
 * Default side sensor length as a ratio of the front sensor ray length.
 *
 * Side rays are intentionally shorter than front rays because side awareness is
 * mainly used for nearby lane-boundary, road-edge, and adjacent-object checks.
 */
export const DEFAULT_SIDE_SENSOR_LENGTH_RATIO = 0.6;

/**
 * Stable semantic labels for the default side sensor rays.
 *
 * These labels are used for debugging, telemetry, future dashboard display, and
 * future mapping between generated rays and sensor readings.
 */
export type SideSensorRayLabel =
  | "left-diagonal-front"
  | "left-side"
  | "right-diagonal-front"
  | "right-side";

/**
 * Canonical ordering for the default side sensor profile.
 *
 * Order:
 * 1. Left diagonal front
 * 2. Left side
 * 3. Right diagonal front
 * 4. Right side
 */
export const DEFAULT_SIDE_SENSOR_RAY_LABELS: readonly SideSensorRayLabel[] =
  Object.freeze([
    "left-diagonal-front",
    "left-side",
    "right-diagonal-front",
    "right-side",
  ]);

/**
 * A generated side sensor ray with a stable semantic label.
 *
 * The label gives driving-domain meaning to the generic SensorRay geometry.
 */
export interface SideSensorRay {
  /** Semantic label describing the ray's side-sensor role. */
  readonly label: SideSensorRayLabel;

  /** Generated geometric ray. */
  readonly ray: SensorRay;
}

/**
 * Grouped side sensor rays.
 *
 * `left` and `right` allow future dashboard, AI, and detection systems to
 * reason about each side independently.
 *
 * `all` preserves deterministic combined ordering for tests, rendering, and
 * future batch processing.
 */
export interface SideSensorRayGroups {
  /** Left-side rays only. */
  readonly left: readonly SideSensorRay[];

  /** Right-side rays only. */
  readonly right: readonly SideSensorRay[];

  /** Combined rays in canonical deterministic order. */
  readonly all: readonly SideSensorRay[];
}

/**
 * Runtime side sensor profile configuration.
 *
 * This profile is derived from the broader SensorConfig, but keeps side-specific
 * tuning explicit.
 */
export interface SideSensorProfileConfig {
  /** Front ray length from the base sensor configuration. */
  readonly frontRayLength: number;

  /** Shorter side ray length derived from the front ray length. */
  readonly sideRayLength: number;

  /** Whether sensors are enabled. */
  readonly sensorEnabled: boolean;
}

/**
 * Creates the default side sensor profile configuration.
 *
 * The supplied SensorConfig is validated through createSensorConfig() before
 * side-specific values are derived.
 */
export function createDefaultSideSensorProfileConfig(
  sensorConfig: SensorConfig,
): SideSensorProfileConfig {
  const validatedConfig = createSensorConfig(sensorConfig);

  return {
    frontRayLength: validatedConfig.rayLength,
    sideRayLength: validatedConfig.rayLength * DEFAULT_SIDE_SENSOR_LENGTH_RATIO,
    sensorEnabled: validatedConfig.sensorEnabled,
  };
}

/**
 * Generates deterministic left and right side sensor rays for a car.
 *
 * Ray layout:
 * - left-diagonal-front: car.angle - Math.PI / 4
 * - left-side:           car.angle - Math.PI / 2
 * - right-diagonal-front: car.angle + Math.PI / 4
 * - right-side:           car.angle + Math.PI / 2
 *
 * This function only generates geometry. It does not detect intersections or
 * produce SensorReading objects.
 */
export function castSideSensorRays(params: {
  /** Minimal car pose required for side ray generation. */
  readonly car: Pick<CarState, "positionX" | "positionY" | "angle">;

  /** Base sensor configuration used to derive side ray length and enabled state. */
  readonly sensorConfig: SensorConfig;
}): SideSensorRayGroups {
  const profileConfig = createDefaultSideSensorProfileConfig(params.sensorConfig);

  // Disabled sensors return empty groups rather than preserving stale rays.
  if (!profileConfig.sensorEnabled) {
    return {
      left: [],
      right: [],
      all: [],
    };
  }

  if (!Number.isFinite(params.car.positionX)) {
    throw new RangeError("car.positionX must be finite.");
  }

  if (!Number.isFinite(params.car.positionY)) {
    throw new RangeError("car.positionY must be finite.");
  }

  if (!Number.isFinite(params.car.angle)) {
    throw new RangeError("car.angle must be finite.");
  }

  if (
    !Number.isFinite(profileConfig.sideRayLength) ||
    profileConfig.sideRayLength <= 0 ||
    profileConfig.sideRayLength >= profileConfig.frontRayLength
  ) {
    throw new RangeError(
      "sideRayLength must be finite, positive, and shorter than frontRayLength.",
    );
  }

  const origin = createSensorPoint(params.car.positionX, params.car.positionY);
  const heading = params.car.angle;
  const sideRayLength = profileConfig.sideRayLength;

  const leftDiagonalFront: SideSensorRay = {
    label: "left-diagonal-front",
    ray: castRay({
      origin,
      angle: heading - Math.PI / 4,
      rayLength: sideRayLength,
      index: 0,
    }),
  };

  const leftSide: SideSensorRay = {
    label: "left-side",
    ray: castRay({
      origin,
      angle: heading - Math.PI / 2,
      rayLength: sideRayLength,
      index: 1,
    }),
  };

  const rightDiagonalFront: SideSensorRay = {
    label: "right-diagonal-front",
    ray: castRay({
      origin,
      angle: heading + Math.PI / 4,
      rayLength: sideRayLength,
      index: 2,
    }),
  };

  const rightSide: SideSensorRay = {
    label: "right-side",
    ray: castRay({
      origin,
      angle: heading + Math.PI / 2,
      rayLength: sideRayLength,
      index: 3,
    }),
  };

  const left = [leftDiagonalFront, leftSide];
  const right = [rightDiagonalFront, rightSide];

  return {
    left,
    right,
    all: [...left, ...right],
  };
}
