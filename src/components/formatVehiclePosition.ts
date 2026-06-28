/**
 * Formats vehicle canvas coordinates for dashboard telemetry.
 *
 * Coordinate system:
 * - origin is top-left
 * - positive X moves right
 * - positive Y moves down
 */
export function formatVehiclePosition(positionX: number, positionY: number): string {
  const safeX = Number.isFinite(positionX) ? Math.round(positionX) : 0;
  const safeY = Number.isFinite(positionY) ? Math.round(positionY) : 0;

  return `X: ${safeX} | Y: ${safeY}`;
}
