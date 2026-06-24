/**
 * Time utilities for the simulation engine.
 *
 * These utilities are intentionally pure functions so they are easy to test.
 * Future game-loop, physics, telemetry, and replay systems can reuse them.
 */

/**
 * Converts milliseconds to seconds.
 *
 * @param milliseconds - A finite duration in milliseconds.
 * @returns The equivalent duration in seconds.
 *
 * @throws Error when the input is not a finite number.
 */
export function millisecondsToSeconds(milliseconds: number): number {
  if (!Number.isFinite(milliseconds)) {
    throw new Error("milliseconds must be a finite number");
  }

  return milliseconds / 1000;
}

/**
 * Clamps delta time to a safe maximum.
 *
 * Long browser pauses, tab switching, or debugger pauses can create very large
 * frame deltas. A capped delta prevents cars, sensors, and physics from jumping
 * unrealistically when the simulation resumes.
 *
 * @param deltaSeconds - Frame delta time in seconds.
 * @param maxDeltaSeconds - Maximum allowed delta time in seconds.
 * @returns A safe delta time value.
 *
 * @throws Error when either input is invalid.
 */
export function clampDeltaTime(deltaSeconds: number, maxDeltaSeconds = 0.1): number {
  if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0) {
    throw new Error("deltaSeconds must be a non-negative finite number");
  }

  if (!Number.isFinite(maxDeltaSeconds) || maxDeltaSeconds <= 0) {
    throw new Error("maxDeltaSeconds must be a positive finite number");
  }

  return Math.min(deltaSeconds, maxDeltaSeconds);
}
