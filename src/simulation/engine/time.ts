/**
 * Time utilities for the simulation engine.
 *
 * These utilities are intentionally pure functions so they are easy to test.
 * Future game-loop, physics, telemetry, and replay systems can reuse them.
 */

export const DEFAULT_MAX_DELTA_TIME_SECONDS = 0.05;

/**
 * Converts milliseconds to seconds.
 *
 * @param milliseconds - A finite duration in milliseconds.
 * @returns The equivalent duration in seconds.
 *
 * @throws Error when the input is not a finite number.
 */
export function millisecondsToSeconds(milliseconds: number): number {
  if (!Number.isFinite(milliseconds) || milliseconds < 0) {
    throw new RangeError("milliseconds must be a finite non-negative number.");
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
export function clampDeltaTime(
  deltaSeconds: number,
  maxDeltaSeconds = DEFAULT_MAX_DELTA_TIME_SECONDS,
): number {
  if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0) {
    throw new RangeError("deltaSeconds must be a finite non-negative number.");
  }

  if (!Number.isFinite(maxDeltaSeconds) || maxDeltaSeconds <= 0) {
    throw new RangeError("maxDeltaSeconds must be a finite positive number.");
  }

  return Math.min(deltaSeconds, maxDeltaSeconds);
}

/**
 * Converts a raw frame delta in milliseconds into safe physics seconds.
 */
export function normalizeFrameDeltaSeconds(
  frameDeltaMs: number,
  maxDeltaSeconds = DEFAULT_MAX_DELTA_TIME_SECONDS,
): number {
  return clampDeltaTime(millisecondsToSeconds(frameDeltaMs), maxDeltaSeconds);
}