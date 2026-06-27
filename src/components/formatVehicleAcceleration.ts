/**
 * Formats configured vehicle acceleration for MVP dashboard telemetry.
 *
 * Unit:
 * - pixels per second squared
 *
 * This is the configured acceleration capability, not instantaneous velocity
 * change and not throttle percentage.
 */
export function formatVehicleAcceleration(acceleration: number): string {
  if (!Number.isFinite(acceleration)) {
    return "0";
  }

  return Math.round(acceleration).toString();
}
