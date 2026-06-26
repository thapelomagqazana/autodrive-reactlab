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

export function clampSpeed(
  speed: number,
  maxSpeed: number,
  maxReverseSpeed: number,
): number {
  if (!Number.isFinite(speed)) {
    throw new RangeError("speed must be finite.");
  }

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

  if (!Number.isFinite(car.speed)) {
    throw new RangeError("car.speed must be finite.");
  }

  if (!Number.isFinite(car.acceleration) || car.acceleration < 0) {
    throw new RangeError("car.acceleration must be a finite non-negative number.");
  }

  const nextSpeed = input.isAccelerating
    ? car.speed + car.acceleration * deltaTimeSeconds
    : car.speed;

  return clampSpeed(nextSpeed, car.maxSpeed, car.maxReverseSpeed);
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

  const speed = applyAccelerationToSpeed(car, input, deltaTimeSeconds);

  return {
    ...car,
    speed,
  };
}
