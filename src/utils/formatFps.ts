/**
 * Formats sampled FPS telemetry for dashboard display.
 *
 * This does not calculate FPS. It only formats the sampled value.
 */
export function formatFps(value: number): string {
  if (!Number.isFinite(value) || value < 0) {
    return "0";
  }

  return String(Math.round(value));
}