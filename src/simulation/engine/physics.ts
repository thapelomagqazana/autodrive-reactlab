/**
 * Pure car physics utilities for AutoDrive ReactLab.
 *
 * Responsibility:
 * - Calculate the next CarState from previous CarState, input, and delta time.
 *
 * Non-responsibilities:
 * - No Zustand access.
 * - No React access.
 * - No keyboard reads.
 * - No canvas drawing.
 * - No requestAnimationFrame.
 */

import type { CarState } from "../vehicle";

export interface CarPhysicsInput {
  isAccelerating: boolean;
  isBraking: boolean;
  /**
   * Normalized steering intent.
   *
   * - -1 = full left
   * - 0 = no steering input
   * - 1 = full right
   *
   * This value does not move the car sideways directly. Later steering physics
   * converts it into CarState.steeringAngle.
   */
  steeringInput: number;
}

export const NEUTRAL_CAR_PHYSICS_INPUT: Readonly<CarPhysicsInput> = Object.freeze({
  isAccelerating: false,
  isBraking: false,
  isSteeringLeft: false,
  steeringInput: 0,
});

/**
 * Returns true when the raw steering input can be safely normalized.
 */
export function isValidRawSteeringInput(value: number): boolean {
  return Number.isFinite(value);
}

/**
 * Clamps raw steering intent into the normalized physics range.
 *
 * Input convention:
 * - negative = left
 * - zero = straight / no input
 * - positive = right
 */
export function clampSteeringInput(value: number): number {
  if (!isValidRawSteeringInput(value)) {
    throw new RangeError("steeringInput must be a finite number.");
  }

  return Math.min(1, Math.max(-1, value));
}

/**
 * Creates a safe CarPhysicsInput object from potentially untrusted control
 * values. This is useful for keyboard input, AI input, test fixtures, and
 * future scenario tooling.
 */
export function createCarPhysicsInput(
  input: Partial<CarPhysicsInput> = {},
): CarPhysicsInput {
  return {
    isAccelerating: input.isAccelerating ?? false,
    isBraking: input.isBraking ?? false,
    steeringInput: clampSteeringInput(input.steeringInput ?? 0),
  };
}

export function isValidDeltaTimeSeconds(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

export function assertValidDeltaTimeSeconds(deltaTimeSeconds: number): void {
  if (!isValidDeltaTimeSeconds(deltaTimeSeconds)) {
    throw new RangeError("deltaTimeSeconds must be a finite non-negative number.");
  }
}

export function assertFiniteNumber(value: number, label: string): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${label} must be finite.`);
  }
}

export function assertNonNegativeFiniteNumber(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${label} must be a finite non-negative number.`);
  }
}

export function clampSpeed(
  speed: number,
  maxSpeed: number,
  maxReverseSpeed: number,
): number {
  assertFiniteNumber(speed, "speed");

  if (!Number.isFinite(maxSpeed) || maxSpeed <= 0) {
    throw new RangeError("maxSpeed must be a finite positive number.");
  }

  if (!Number.isFinite(maxReverseSpeed) || maxReverseSpeed <= 0) {
    throw new RangeError("maxReverseSpeed must be a finite positive number.");
  }

  return Math.min(maxSpeed, Math.max(-maxReverseSpeed, speed));
}

/**
 * Convenience helper that clamps speed using the limits on CarState.
 */
export function clampCarPhysicsSpeed(
  car: Pick<CarState, "speed" | "maxSpeed" | "maxReverseSpeed">,
): number {
  return clampSpeed(car.speed, car.maxSpeed, car.maxReverseSpeed);
}

export function applyAccelerationToSpeed(
  car: Pick<CarState, "speed" | "acceleration" | "maxSpeed" | "maxReverseSpeed">,
  input: Pick<CarPhysicsInput, "isAccelerating">,
  deltaTimeSeconds: number,
): number {
  assertValidDeltaTimeSeconds(deltaTimeSeconds);
  assertFiniteNumber(car.speed, "car.speed");
  assertNonNegativeFiniteNumber(car.acceleration, "car.acceleration");

  const nextSpeed = input.isAccelerating
    ? car.speed + car.acceleration * deltaTimeSeconds
    : car.speed;

  return clampSpeed(nextSpeed, car.maxSpeed, car.maxReverseSpeed);
}

/**
 * Applies natural deceleration to speed.
 *
 * The friction value is measured in pixels per second squared.
 *
 * Direction safety:
 * - forward speed cannot become reverse speed from friction
 * - reverse speed cannot become forward speed from friction
 */
export function applyFrictionToSpeed(
  speed: number,
  friction: number,
  deltaTimeSeconds: number,
): number {
  assertValidDeltaTimeSeconds(deltaTimeSeconds);
  assertFiniteNumber(speed, "speed");
  assertNonNegativeFiniteNumber(friction, "friction");

  const frictionAmount = friction * deltaTimeSeconds;

  if (speed > 0) {
    return Math.max(0, speed - frictionAmount);
  }

  if (speed < 0) {
    return Math.min(0, speed + frictionAmount);
  }

  return 0;
}

export function isValidFrictionValue(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

/**
 * Resolves friction from car state when available, otherwise uses the MVP
 * default. This keeps the physics API stable while allowing CarState to gain a
 * formal friction field later.
 */
export function resolveCarFriction(car: Pick<CarState, "friction">): number {
  if (!isValidFrictionValue(car.friction)) {
    throw new RangeError("car.friction must be a finite non-negative value.");
  }

  return car.friction;
}

/**
 * Minimal position result returned by movement integration.
 */
export interface CarPositionUpdate {
  positionX: number;
  positionY: number;
  distanceTravelled: number;
}

/**
 * Calculates how far the car moves during this physics step.
 *
 * Unit:
 * - speed is pixels per second
 * - deltaTimeSeconds is seconds
 * - result is pixels
 */
export function calculateTravelDistance(speed: number, deltaTimeSeconds: number): number {
  assertFiniteNumber(speed, "speed");
  assertValidDeltaTimeSeconds(deltaTimeSeconds);

  return speed * deltaTimeSeconds;
}

/**
 * Updates car position using speed, heading angle, and elapsed time.
 *
 * Coordinate convention:
 * - 0 radians = upward / north
 * - positive Y points down
 * - positive speed moves forward
 * - negative speed moves backward
 *
 * Movement formula:
 * - x += sin(angle) * distance
 * - y -= cos(angle) * distance
 */
export function updatePositionUsingSpeedAndHeading(
  car: Pick<
    CarState,
    "positionX" | "positionY" | "speed" | "angle" | "distanceTravelled"
  >,
  deltaTimeSeconds: number,
): CarPositionUpdate {
  assertFiniteNumber(car.positionX, "car.positionX");
  assertFiniteNumber(car.positionY, "car.positionY");
  assertFiniteNumber(car.speed, "car.speed");
  assertFiniteNumber(car.angle, "car.angle");
  assertNonNegativeFiniteNumber(car.distanceTravelled, "car.distanceTravelled");
  assertValidDeltaTimeSeconds(deltaTimeSeconds);

  const distance = calculateTravelDistance(car.speed, deltaTimeSeconds);

  return {
    positionX: car.positionX + Math.sin(car.angle) * distance,
    positionY: car.positionY - Math.cos(car.angle) * distance,

    /**
     * Distance travelled is total path length, so reverse movement still adds
     * positive travelled distance.
     */
    distanceTravelled: car.distanceTravelled + Math.abs(distance),
  };
}

/**
 * Calculates the next car state.
 *
 * This first MVP physics shell is intentionally conservative:
 * - It validates time.
 * - It returns a fresh object.
 * - It preserves current state until acceleration, friction, steering, and
 *   position rules are added in later Phase 1.6 tasks.
 */
export function updateCarPhysics(
  car: CarState,
  input: CarPhysicsInput,
  deltaTimeSeconds: number,
): CarState {
  assertValidDeltaTimeSeconds(deltaTimeSeconds);

  const normalizedInput = createCarPhysicsInput(input);

  const acceleratedSpeed = applyAccelerationToSpeed(
    car,
    normalizedInput,
    deltaTimeSeconds,
  );

  const shouldApplyFriction =
    !normalizedInput.isAccelerating && !normalizedInput.isBraking;

  const speedBeforeFinalClamp = shouldApplyFriction
    ? applyFrictionToSpeed(acceleratedSpeed, car.friction, deltaTimeSeconds)
    : acceleratedSpeed;

  const speed = clampSpeed(speedBeforeFinalClamp, car.maxSpeed, car.maxReverseSpeed);

  const position = updatePositionUsingSpeedAndHeading(
    {
      ...car,
      speed,
    },
    deltaTimeSeconds,
  );

  return {
    ...car,
    ...position,
    speed,
  };
}
