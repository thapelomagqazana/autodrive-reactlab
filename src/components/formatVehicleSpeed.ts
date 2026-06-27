/**
 * Formats simulation vehicle speed for MVP dashboard telemetry.
 *
 * Unit:
 * - pixels per second
 *
 * MVP rule:
 * - display rounded integer
 */
export function formatVehicleSpeed(speed: number): string {
  if (!Number.isFinite(speed)) {
    return "0";
  }

  return Math.round(speed).toString();
}
