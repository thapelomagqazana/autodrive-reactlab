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
  accelerate: boolean;
  brake: boolean;
  steerLeft: boolean;
  steerRight: boolean;
}

export const NEUTRAL_CAR_PHYSICS_INPUT: Readonly<CarPhysicsInput> = Object.freeze({
  accelerate: false,
  brake: false,
  steerLeft: false,
  steerRight: false,
});

export function isValidDeltaTimeSeconds(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

export function assertValidDeltaTimeSeconds(deltaTimeSeconds: number): void {
  if (!isValidDeltaTimeSeconds(deltaTimeSeconds)) {
    throw new RangeError("deltaTimeSeconds must be a finite non-negative number.");
  }
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
  _input: CarPhysicsInput,
  deltaTimeSeconds: number,
): CarState {
  assertValidDeltaTimeSeconds(deltaTimeSeconds);

  return {
    ...car,
  };
}
