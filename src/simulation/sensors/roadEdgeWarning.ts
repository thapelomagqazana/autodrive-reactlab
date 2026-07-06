/**
 * Road-edge warning logic for AutoDrive ReactLab.
 *
 * This module converts road-boundary sensor readings into left/right warning
 * signals for dashboard display and future AI decision inputs.
 *
 * Responsibility:
 * - Validate warning/danger thresholds.
 * - Evaluate left road-edge proximity.
 * - Evaluate right road-edge proximity.
 * - Derive overall warning severity.
 * - Expose nearest road-edge side and distance.
 *
 * This module intentionally does not:
 * - Generate rays.
 * - Detect road-edge intersections.
 * - Render overlays.
 * - Read from Zustand.
 * - Update CarState.
 * - Steer, brake, or control the vehicle.
 *
 * Distance convention:
 * - Distances use simulation world/canvas units.
 * - Lower distance means closer to a road edge.
 */

import type { SensorReading } from "./sensorModel";

/**
 * Supported road-edge sides.
 */
export type RoadEdgeSide = "left" | "right";

/**
 * Road-edge warning severity states.
 *
 * Semantics:
 * - disabled: sensors are off
 * - unknown: sensors are enabled, but no road-boundary data exists
 * - safe: nearest edge is beyond warning threshold
 * - warning: nearest edge is within warning threshold
 * - danger: nearest edge is within danger threshold
 */
export type RoadEdgeWarningState =
  | "disabled"
  | "unknown"
  | "safe"
  | "warning"
  | "danger"
  | "off-road";

/**
 * Tunable threshold distances for road-edge warnings.
 */
export interface RoadEdgeWarningThresholds {
  /** Distance at or below which warning state begins. */
  readonly warningDistance: number;

  /** Distance at or below which danger state begins. */
  readonly dangerDistance: number;
}

/**
 * Input required to evaluate road-edge warning state.
 */
export interface RoadEdgeWarningInput {
  /** Whether sensors are globally enabled. */
  readonly sensorEnabled: boolean;
  readonly isCarOffRoad: boolean;

  /** Road-boundary-capable readings for the left side. */
  readonly leftReadings: readonly SensorReading[];

  /** Road-boundary-capable readings for the right side. */
  readonly rightReadings: readonly SensorReading[];

  /** Optional threshold overrides. */
  readonly thresholds?: Partial<RoadEdgeWarningThresholds>;
}

/**
 * Warning result for one road edge side.
 */
export interface RoadEdgeSideWarning {
  /** Side represented by this warning result. */
  readonly side: RoadEdgeSide;

  /** Evaluated warning state for the side. */
  readonly state: RoadEdgeWarningState;

  /** Nearest road-boundary distance for the side, or null when unavailable. */
  readonly nearestDistance: number | null;
}

/**
 * Complete road-edge warning result for dashboard and future AI consumers.
 */
export interface RoadEdgeWarningResult {
  /** Left side warning result. */
  readonly left: RoadEdgeSideWarning;

  /** Right side warning result. */
  readonly right: RoadEdgeSideWarning;

  /** Highest-severity warning state across both sides. */
  readonly overallState: RoadEdgeWarningState;

  /** Nearest road-edge distance across both sides, or null when unavailable. */
  readonly nearestDistance: number | null;

  /** Side containing the nearest road-edge detection, or null when unavailable. */
  readonly nearestSide: RoadEdgeSide | null;

  /** Thresholds used for this evaluation. */
  readonly thresholds: RoadEdgeWarningThresholds;
}

/**
 * Default road-edge warning thresholds.
 */
export const DEFAULT_ROAD_EDGE_WARNING_THRESHOLDS: Readonly<RoadEdgeWarningThresholds> =
  Object.freeze({
    warningDistance: 80,
    dangerDistance: 35,
  });

/**
 * Severity ranking used to derive the overall warning state.
 *
 * Higher number means higher severity.
 */
const SEVERITY_RANK: Record<RoadEdgeWarningState, number> = {
  disabled: 0,
  unknown: 1,
  safe: 2,
  warning: 3,
  danger: 4,
  "off-road": 5,
};

/**
 * Narrowed SensorReading type for detected readings.
 */
type DetectedSensorReading = Extract<SensorReading, { detected: true }>;

/**
 * Type guard for detected sensor readings.
 */
function isDetectedReading(reading: SensorReading): reading is DetectedSensorReading {
  return reading.detected;
}

/**
 * Ensures a threshold distance is finite and positive.
 */
function assertFinitePositiveDistance(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${label} must be a finite positive distance.`);
  }
}

/**
 * Creates validated road-edge warning thresholds.
 *
 * Rules:
 * - warningDistance must be finite and positive.
 * - dangerDistance must be finite and positive.
 * - dangerDistance must be less than warningDistance.
 */
export function createRoadEdgeWarningThresholds(
  overrides: Partial<RoadEdgeWarningThresholds> = {},
): RoadEdgeWarningThresholds {
  const thresholds = {
    ...DEFAULT_ROAD_EDGE_WARNING_THRESHOLDS,
    ...overrides,
  };

  assertFinitePositiveDistance(thresholds.warningDistance, "warningDistance");
  assertFinitePositiveDistance(thresholds.dangerDistance, "dangerDistance");

  if (thresholds.dangerDistance >= thresholds.warningDistance) {
    throw new RangeError("dangerDistance must be less than warningDistance.");
  }

  return thresholds;
}

/**
 * Finds the nearest road-boundary detection distance from a group of readings.
 *
 * Non-detected readings and non-road-boundary detections are ignored.
 */
function getNearestRoadBoundaryDistance(
  readings: readonly SensorReading[],
): number | null {
  let nearestDistance: number | null = null;

  for (const reading of readings) {
    if (!isDetectedReading(reading)) {
      continue;
    }

    if (reading.detectionType !== "road-boundary") {
      continue;
    }

    if (!Number.isFinite(reading.distance) || reading.distance < 0) {
      throw new RangeError(
        "Detected road-boundary distance must be finite and non-negative.",
      );
    }

    if (nearestDistance === null || reading.distance < nearestDistance) {
      nearestDistance = reading.distance;
    }
  }

  return nearestDistance;
}

/**
 * Evaluates warning state for one road edge side.
 */
function evaluateSideWarning(params: {
  /** Side being evaluated. */
  readonly side: RoadEdgeSide;

  /** Sensor readings associated with this side. */
  readonly readings: readonly SensorReading[];

  /** Validated thresholds. */
  readonly thresholds: RoadEdgeWarningThresholds;

  /** Whether sensors are globally enabled. */
  readonly sensorEnabled: boolean;
}): RoadEdgeSideWarning {
  if (!params.sensorEnabled) {
    return {
      side: params.side,
      state: "disabled",
      nearestDistance: null,
    };
  }

  const nearestDistance = getNearestRoadBoundaryDistance(params.readings);

  if (nearestDistance === null) {
    return {
      side: params.side,
      state: "unknown",
      nearestDistance: null,
    };
  }

  if (nearestDistance <= params.thresholds.dangerDistance) {
    return {
      side: params.side,
      state: "danger",
      nearestDistance,
    };
  }

  if (nearestDistance <= params.thresholds.warningDistance) {
    return {
      side: params.side,
      state: "warning",
      nearestDistance,
    };
  }

  return {
    side: params.side,
    state: "safe",
    nearestDistance,
  };
}

/**
 * Chooses the highest-severity state across both sides.
 */
function chooseOverallState(
  left: RoadEdgeSideWarning,
  right: RoadEdgeSideWarning,
): RoadEdgeWarningState {
  return SEVERITY_RANK[left.state] >= SEVERITY_RANK[right.state]
    ? left.state
    : right.state;
}

/**
 * Chooses the side with the nearest available road-edge distance.
 */
function chooseNearestSide(
  left: RoadEdgeSideWarning,
  right: RoadEdgeSideWarning,
): RoadEdgeSide | null {
  if (left.nearestDistance === null && right.nearestDistance === null) {
    return null;
  }

  if (left.nearestDistance === null) {
    return "right";
  }

  if (right.nearestDistance === null) {
    return "left";
  }

  return left.nearestDistance <= right.nearestDistance ? "left" : "right";
}

/**
 * Evaluates complete road-edge warning state.
 *
 * This is the main public selector/evaluator for dashboard and future AI
 * consumers.
 */
export function evaluateRoadEdgeWarning(
  input: RoadEdgeWarningInput,
): RoadEdgeWarningResult {
  const thresholds = createRoadEdgeWarningThresholds(input.thresholds);

  if (!input.sensorEnabled) {
    return {
      left: { side: "left", state: "disabled", nearestDistance: null },
      right: { side: "right", state: "disabled", nearestDistance: null },
      overallState: "disabled",
      nearestDistance: null,
      nearestSide: null,
      thresholds,
    };
  }

  if (input.isCarOffRoad) {
    return {
      left: { side: "left", state: "off-road", nearestDistance: null },
      right: { side: "right", state: "off-road", nearestDistance: null },
      overallState: "off-road",
      nearestDistance: null,
      nearestSide: null,
      thresholds,
    };
  }

  const left = evaluateSideWarning({
    side: "left",
    readings: input.leftReadings,
    thresholds,
    sensorEnabled: input.sensorEnabled,
  });

  const right = evaluateSideWarning({
    side: "right",
    readings: input.rightReadings,
    thresholds,
    sensorEnabled: input.sensorEnabled,
  });

  const nearestSide = chooseNearestSide(left, right);
  const nearestDistance =
    nearestSide === "left"
      ? left.nearestDistance
      : nearestSide === "right"
        ? right.nearestDistance
        : null;

  return {
    left,
    right,
    overallState: chooseOverallState(left, right),
    nearestDistance,
    nearestSide,
    thresholds,
  };
}
