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
  isSteeringLeft: boolean;
  isSteeringRight: boolean;
}

export const NEUTRAL_CAR_PHYSICS_INPUT: Readonly<CarPhysicsInput> = Object.freeze({
  isAccelerating: false,
  isBraking: false,
  isSteeringLeft: false,
  isSteeringRight: false,
});

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

  const acceleratedSpeed = applyAccelerationToSpeed(car, input, deltaTimeSeconds);

  const shouldApplyFriction = !input.isAccelerating && !input.isBraking;

  const speed = shouldApplyFriction
    ? applyFrictionToSpeed(acceleratedSpeed, resolveCarFriction(car), deltaTimeSeconds)
    : acceleratedSpeed;

  return {
    ...car,
    speed,
  };
}
