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
import {
  getDefaultStartLaneIndex,
  getLaneCenterX,
  getLaneWidth,
  isValidLaneIndex,
} from "../world";
import {
  DEFAULT_CAR_ACCELERATION,
  DEFAULT_CAR_FRICTION,
  DEFAULT_CAR_ANGLE,
  DEFAULT_CAR_MAX_REVERSE_SPEED,
  DEFAULT_CAR_MAX_SPEED,
  DEFAULT_CAR_SPEED,
  DEFAULT_CAR_STEERING_ANGLE,
  DEFAULT_CAR_TURN_RATE,
  type CarDecision,
  type CarState,
  createCarPosition,
  createInitialCarState,
  isPositiveSpeedLimit,
  isValidAccelerationValue,
  isValidCarSpeedValue,
  isValidHeadingAngle,
  isValidSteeringAngle,
  isValidTurnRate,
  isValidFrictionValue,
} from "./carState";

/**
 * Optional overrides for initial car creation.
 */
export interface CreateInitialCarOptions {
  /**
   * Zero-based lane index where the car should spawn.
   *
   * If omitted, the default start lane is used:
   * - odd lane count: true center lane
   * - even lane count: left-middle lane
   */
  startLaneIndex?: number;

  /**
   * Distance in pixels from road.bottomY to the car center.
   *
   * Larger values place the car higher up the road.
   */
  startOffsetFromBottom?: number;

  /**
   * Explicit X override.
   *
   * Prefer startLaneIndex for normal simulation spawning. This is mainly for
   * tests, scenario editors, and future replay tooling.
   */
  positionX?: number;

  /** Explicit Y override. */
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
  turnRate?: number;
  friction?: number;
}

export interface CarDimensions {
  /** Car visual/collision width in pixels. */
  width: number;

  /** Car visual/collision height in pixels. */
  height: number;
}

export interface CarBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export const DEFAULT_INITIAL_CAR_WIDTH = 36;
export const DEFAULT_INITIAL_CAR_HEIGHT = 64;

/**
 * Default distance from road.bottomY to the car center.
 *
 * With the current MVP road, this keeps the car visible near the lower part of
 * the canvas while still fully inside the road.
 */
export const DEFAULT_START_OFFSET_FROM_BOTTOM = 300;

export const DEFAULT_INITIAL_CAR_DIMENSIONS: Readonly<CarDimensions> = Object.freeze({
  width: DEFAULT_INITIAL_CAR_WIDTH,
  height: DEFAULT_INITIAL_CAR_HEIGHT,
});

export function isValidCarDimension(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

export function assertValidCarDimensions(dimensions: CarDimensions): void {
  if (!isValidCarDimension(dimensions.width)) {
    throw new RangeError("Car width must be a finite positive pixel value.");
  }

  if (!isValidCarDimension(dimensions.height)) {
    throw new RangeError("Car height must be a finite positive pixel value.");
  }
}

export function getCarBoundsFromCenter(
  positionX: number,
  positionY: number,
  dimensions: CarDimensions,
): CarBounds {
  assertValidCarDimensions(dimensions);

  if (!Number.isFinite(positionX)) {
    throw new RangeError("positionX must be finite.");
  }

  if (!Number.isFinite(positionY)) {
    throw new RangeError("positionY must be finite.");
  }

  return {
    left: positionX - dimensions.width / 2,
    right: positionX + dimensions.width / 2,
    top: positionY - dimensions.height / 2,
    bottom: positionY + dimensions.height / 2,
  };
}

export function assertCarFitsInsideLane(
  road: Road,
  laneIndex: number,
  dimensions: CarDimensions,
): void {
  assertValidCarDimensions(dimensions);

  const laneWidth = getLaneWidth(road);

  if (dimensions.width >= laneWidth) {
    throw new RangeError(
      `Car width must be less than selected lane width. Received car width ${dimensions.width}px for lane width ${laneWidth}px.`,
    );
  }

  if (!isValidLaneIndex(road, laneIndex)) {
    throw new RangeError(
      `laneIndex must be an integer between 0 and ${road.laneCount - 1}.`,
    );
  }
}

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

function resolveStartLaneIndex(road: Road, startLaneIndex?: number): number {
  const laneIndex = startLaneIndex ?? getDefaultStartLaneIndex(road);

  if (!isValidLaneIndex(road, laneIndex)) {
    throw new RangeError(
      `startLaneIndex must be an integer between 0 and ${road.laneCount - 1}.`,
    );
  }

  return laneIndex;
}

function resolveInitialPosition(
  road: Road,
  options: CreateInitialCarOptions,
): { laneIndex: number; positionX: number; positionY: number } {
  const startOffsetFromBottom =
    options.startOffsetFromBottom ?? DEFAULT_START_OFFSET_FROM_BOTTOM;

  assertNonNegativeFinite(startOffsetFromBottom, "startOffsetFromBottom");

  const laneIndex = resolveStartLaneIndex(road, options.startLaneIndex);

  return {
    laneIndex,
    positionX: options.positionX ?? getLaneCenterX(road, laneIndex),
    positionY: options.positionY ?? road.bottomY - startOffsetFromBottom,
  };
}

/**
 * Creates a complete initial CarState using road-derived spawn geometry.
 */
export function createInitialCar(
  road: Road,
  options: CreateInitialCarOptions = {},
): CarState {
  const baseCar = createInitialCarState();

  const { laneIndex, positionX, positionY } = resolveInitialPosition(road, options);
  const position = createCarPosition(positionX, positionY);

  const width = options.width ?? DEFAULT_INITIAL_CAR_WIDTH;
  const height = options.height ?? DEFAULT_INITIAL_CAR_HEIGHT;

  const dimensions = {
    width,
    height,
  };

  assertValidCarDimensions(dimensions);
  assertCarFitsInsideLane(road, laneIndex, dimensions);
  const speed = options.speed ?? DEFAULT_CAR_SPEED;
  const acceleration = options.acceleration ?? DEFAULT_CAR_ACCELERATION;
  const friction = options.friction ?? DEFAULT_CAR_FRICTION;
  const angle = options.angle ?? DEFAULT_CAR_ANGLE;
  const turnRate = options.turnRate ?? DEFAULT_CAR_TURN_RATE;
  const steeringAngle = options.steeringAngle ?? DEFAULT_CAR_STEERING_ANGLE;
  const maxSpeed = options.maxSpeed ?? DEFAULT_CAR_MAX_SPEED;
  const maxReverseSpeed = options.maxReverseSpeed ?? DEFAULT_CAR_MAX_REVERSE_SPEED;
  const distanceTravelled = options.distanceTravelled ?? 0;
  const collisionCount = options.collisionCount ?? 0;

  assertPositiveDimension(width, "width");
  assertPositiveDimension(height, "height");

  if (!isValidTurnRate(turnRate)) {
    throw new RangeError("turnRate must be a finite non-negative value.");
  }

  if (!isValidFrictionValue(friction)) {
    throw new RangeError("friction must be a finite non-negative value.");
  }

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
    friction,
    angle,
    steeringAngle,
    turnRate,
    maxSpeed,
    maxReverseSpeed,
    distanceTravelled,
    collisionCount,
    decision: options.decision ?? "idle",
  };
}
