/**
 * Performance metric helpers for AutoDrive ReactLab.
 *
 * Responsibility:
 * - Convert frame delta time into dashboard-readable FPS.
 *
 * Non-responsibilities:
 * - No React.
 * - No Zustand.
 * - No canvas drawing.
 */

export const DEFAULT_MIN_FPS_DELTA_SECONDS = 1 / 240;
export const DEFAULT_MAX_DISPLAY_FPS = 240;

/**
 * Returns true when a delta time value can safely produce an FPS value.
 */
export function isValidFpsDeltaSeconds(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

/**
 * Converts frame delta seconds into frames per second.
 *
 * Very small deltas are clamped to avoid unrealistic Infinity-like spikes.
 */
export function calculateFps(
  deltaTimeSeconds: number,
  minDeltaSeconds = DEFAULT_MIN_FPS_DELTA_SECONDS,
  maxDisplayFps = DEFAULT_MAX_DISPLAY_FPS,
): number {
  if (!isValidFpsDeltaSeconds(deltaTimeSeconds)) {
    return 0;
  }

  if (!isValidFpsDeltaSeconds(minDeltaSeconds)) {
    throw new RangeError("minDeltaSeconds must be finite and greater than zero.");
  }

  if (!Number.isFinite(maxDisplayFps) || maxDisplayFps <= 0) {
    throw new RangeError("maxDisplayFps must be finite and greater than zero.");
  }

  const safeDelta = Math.max(deltaTimeSeconds, minDeltaSeconds);

  return Math.min(1 / safeDelta, maxDisplayFps);
}
