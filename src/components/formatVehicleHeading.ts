/**
 * Formats vehicle heading for dashboard telemetry.
 *
 * Internal unit:
 * - radians
 *
 * Display unit:
 * - degrees
 *
 * Convention:
 * - 0 radians = north/up on canvas
 * - positive angle = clockwise rotation
 *
 * Display rule:
 * - normalize to [0, 360)
 * - round to the nearest whole degree
 */
export function formatVehicleHeading(radians: number): string {
  if (!Number.isFinite(radians)) {
    return "0°";
  }

  const rawDegrees = (radians * 180) / Math.PI;
  const normalizedDegrees = ((rawDegrees % 360) + 360) % 360;
  const roundedDegrees = Math.round(normalizedDegrees) % 360;

  return `${Object.is(roundedDegrees, -0) ? 0 : roundedDegrees}°`;
}
