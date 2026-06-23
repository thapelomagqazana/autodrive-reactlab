/**
 * Frame renderer lifecycle utilities.
 *
 * These functions define small, reusable primitives for canvas frame lifecycle
 * management.
 *
 * Responsibilities:
 * - Clear the canvas drawing buffer.
 * - Provide a predictable begin-frame primitive.
 *
 * Non-responsibilities:
 * - No React.
 * - No Zustand.
 * - No game loop scheduling.
 * - No road rendering.
 * - No vehicle rendering.
 * - No physics or AI.
 */

export interface FrameDimensions {
  width: number;
  height: number;
}

/**
 * Returns true when a numeric dimension can safely be used for rendering.
 */
function isValidDimension(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

/**
 * Clears the full canvas drawing buffer.
 *
 * This should be called at the beginning of a future render cycle before
 * drawing the grid, road, vehicle, sensors, or overlays.
 *
 * @param context - The 2D canvas rendering context.
 * @param dimensions - The drawing buffer dimensions to clear.
 */
export function clearFrame(
  context: CanvasRenderingContext2D,
  dimensions: FrameDimensions,
): void {
  if (!isValidDimension(dimensions.width) || !isValidDimension(dimensions.height)) {
    return;
  }

  context.clearRect(0, 0, Math.floor(dimensions.width), Math.floor(dimensions.height));
}

/**
 * Begins a render frame by clearing previous visual output.
 *
 * This exists as lifecycle vocabulary for future render-loop work.
 *
 * Current lifecycle:
 * 1. beginFrame
 * 2. draw grid / road / vehicle / sensors
 * 3. endFrame
 */
export function beginFrame(
  context: CanvasRenderingContext2D,
  dimensions: FrameDimensions,
): void {
  clearFrame(context, dimensions);
}

/**
 * Ends a render frame.
 *
 * Currently this is intentionally a no-op. It exists as a future extension
 * point for diagnostics, profiling, debug overlays, or context restoration.
 */
export function endFrame(): void {
  // Intentionally empty.
}