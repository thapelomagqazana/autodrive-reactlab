/**
 * Road-aware initial car factory for AutoDrive ReactLab.
 *
 * Responsibility:
 * - Create the complete default CarState for the MVP simulation.
 * - Place the car on a valid road lane.
 * - Centralize reset/spawn defaults.
 *
 * Non-responsibilities:
 * - No React.
 * - No Zustand.
 * - No canvas rendering.
 * - No physics updates.
 * - No mutation of Road.
 */

import type { Road } from "../world";
import { getDefaultStartLaneCenterX } from "../world";
import {
  DEFAULT_CAR_ACCELERATION,
  DEFAULT_CAR_ANGLE,
  DEFAULT_CAR_MAX_REVERSE_SPEED,
  DEFAULT_CAR_MAX_SPEED,
  DEFAULT_CAR_SPEED,
  DEFAULT_CAR_STEERING_ANGLE,
  type CarDecision,
  type CarState,
  createCarPosition,
  createInitialCarState,
  isPositiveSpeedLimit,
  isValidAccelerationValue,
  isValidCarSpeedValue,
  isValidHeadingAngle,
  isValidSteeringAngle,
} from "./carState";

export interface CreateInitialCarOptions {
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
  speed?: number;
  acceleration?: number;
  angle?: number;
  steeringAngle?: number;
  maxSpeed?: number;
  maxReverseSpeed?: number;
  decision?: CarDecision;
  collisionCount?: number;
  distanceTravelled?: number;
}

export const DEFAULT_INITIAL_CAR_POSITION_Y = 600;
export const DEFAULT_INITIAL_CAR_WIDTH = 36;
export const DEFAULT_INITIAL_CAR_HEIGHT = 64;

function assertPositiveDimension(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${label} must be a finite positive pixel value.`);
  }
}

function assertNonNegativeFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${label} must be a finite non-negative value.`);
  }
}

/**
 * Creates a complete initial CarState using road-derived spawn geometry.
 *
 * By default:
 * - X position comes from the road's default start lane center.
 * - Y position uses the MVP spawn Y.
 * - Speed and steering start at zero.
 * - Heading faces upward/north.
 * - Telemetry starts clean.
 */
export function createInitialCar(
  road: Road,
  options: CreateInitialCarOptions = {},
): CarState {
  const baseCar = createInitialCarState();

  const positionX = options.positionX ?? getDefaultStartLaneCenterX(road);
  const positionY = options.positionY ?? DEFAULT_INITIAL_CAR_POSITION_Y;

  const width = options.width ?? DEFAULT_INITIAL_CAR_WIDTH;
  const height = options.height ?? DEFAULT_INITIAL_CAR_HEIGHT;

  const speed = options.speed ?? DEFAULT_CAR_SPEED;
  const acceleration = options.acceleration ?? DEFAULT_CAR_ACCELERATION;

  const angle = options.angle ?? DEFAULT_CAR_ANGLE;
  const steeringAngle = options.steeringAngle ?? DEFAULT_CAR_STEERING_ANGLE;

  const maxSpeed = options.maxSpeed ?? DEFAULT_CAR_MAX_SPEED;
  const maxReverseSpeed = options.maxReverseSpeed ?? DEFAULT_CAR_MAX_REVERSE_SPEED;

  const distanceTravelled = options.distanceTravelled ?? 0;
  const collisionCount = options.collisionCount ?? 0;

  const position = createCarPosition(positionX, positionY);

  assertPositiveDimension(width, "width");
  assertPositiveDimension(height, "height");

  if (!isValidCarSpeedValue(speed)) {
    throw new RangeError("speed must be a finite pixels-per-second value.");
  }

  if (!isValidAccelerationValue(acceleration)) {
    throw new RangeError("acceleration must be a finite non-negative value.");
  }

  if (!isValidHeadingAngle(angle)) {
    throw new RangeError("angle must be a finite radian value.");
  }

  if (!isValidSteeringAngle(steeringAngle)) {
    throw new RangeError("steeringAngle must be a finite radian value.");
  }

  if (!isPositiveSpeedLimit(maxSpeed)) {
    throw new RangeError("maxSpeed must be a finite positive value.");
  }

  if (!isPositiveSpeedLimit(maxReverseSpeed)) {
    throw new RangeError("maxReverseSpeed must be a finite positive value.");
  }

  assertNonNegativeFinite(distanceTravelled, "distanceTravelled");
  assertNonNegativeFinite(collisionCount, "collisionCount");

  return {
    ...baseCar,
    ...position,

    width,
    height,

    speed,
    acceleration,

    angle,
    steeringAngle,

    maxSpeed,
    maxReverseSpeed,

    distanceTravelled,
    collisionCount,

    decision: options.decision ?? "idle",
  };
}
