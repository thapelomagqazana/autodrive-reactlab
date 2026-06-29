/**
 * Formats the road departure warning flag for dashboard telemetry.
 */
export function formatRoadDepartureWarning(isWarningActive: boolean): string {
  return isWarningActive ? "Off road" : "On road";
}
