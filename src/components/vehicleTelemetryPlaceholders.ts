/**
 * Future vehicle telemetry placeholder contract.
 *
 * These values reserve dashboard space for future systems:
 * - vehicle physics
 * - AI decisions
 * - collision detection
 * - sensor state
 * - destination tracking
 */

export interface VehicleTelemetryPlaceholder {
  speed: string;
  acceleration: string;
  steeringAngle: string;
  heading: string;
  aiDecision: string;
  collisionCount: string;
  sensorStatus: string;
  destinationStatus: string;
}

/**
 * Default placeholder values.
 *
 * These are intentionally static until real telemetry is connected.
 */
export const DEFAULT_VEHICLE_TELEMETRY_PLACEHOLDERS: VehicleTelemetryPlaceholder = {
  speed: "--",
  acceleration: "--",
  steeringAngle: "--",
  heading: "--",
  aiDecision: "Waiting for simulation",
  collisionCount: "0",
  sensorStatus: "Not connected",
  destinationStatus: "N/A",
};
