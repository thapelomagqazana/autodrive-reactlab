/**
 * Formats steering angle for dashboard telemetry.
 *
 * Internal unit:
 * - radians
 *
 * Display unit:
 * - degrees
 *
 * Convention:
 * - negative = left steering
 * - zero = straight
 * - positive = right steering
 */
export function formatSteeringAngle(radians: number): string {
  if (!Number.isFinite(radians)) {
    return "0°";
  }

  const degrees = (radians * 180) / Math.PI;
  const roundedDegrees = Math.round(degrees);

  return `${Object.is(roundedDegrees, -0) ? 0 : roundedDegrees}°`;
}
