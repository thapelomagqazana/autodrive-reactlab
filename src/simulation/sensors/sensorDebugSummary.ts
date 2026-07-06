/**
 * Sensor debug summary selectors for AutoDrive ReactLab.
 *
 * This module converts raw/grouped sensor readings into dashboard-ready values.
 *
 * Responsibility:
 * - Derive sensor enabled/disabled display status.
 * - Summarize front, left, and right sensor groups.
 * - Format nearest detected distances for display.
 * - Identify the nearest detection across all sensor groups.
 *
 * This module intentionally does not:
 * - Generate sensor rays.
 * - Calculate intersections.
 * - Calculate sensor distances.
 * - Render React UI.
 * - Render canvas overlays.
 * - Read from Zustand directly.
 * - Update CarState or SensorState.
 * - Make AI decisions.
 */

import type { SensorReading, SensorDetectionType } from "./sensorModel";
import type { SensorState } from "./sensorState";

/**
 * Supported dashboard sensor groups.
 */
export type SensorDebugGroup = "front" | "left" | "right";

/**
 * Display status derived from sensor configuration.
 */
export type SensorDisplayStatus = "Enabled" | "Disabled";

/**
 * Dashboard-safe distance display value.
 *
 * Values:
 * - "Disabled": sensors are off
 * - "Clear": readings exist but no detection was found
 * - "No data": no readings exist yet
 * - `${number} px`: nearest detected distance
 */
export type SensorDistanceDisplay = "Disabled" | "Clear" | "No data" | `${number} px`;

/**
 * Sensor readings grouped by driving-domain direction.
 *
 * This keeps dashboard selectors independent from ray indexes and future
 * rendering details.
 */
export interface GroupedSensorReadings {
  /** Readings produced by front-facing sensor rays. */
  readonly front: readonly SensorReading[];

  /** Readings produced by left-side sensor rays. */
  readonly left: readonly SensorReading[];

  /** Readings produced by right-side sensor rays. */
  readonly right: readonly SensorReading[];
}

/**
 * Dashboard summary for one sensor group.
 */
export interface SensorGroupSummary {
  /** Group represented by this summary. */
  readonly group: SensorDebugGroup;

  /** Human-readable distance/status value for dashboard display. */
  readonly displayDistance: SensorDistanceDisplay;

  /**
   * Nearest detected reading in this group.
   *
   * Null means either no readings exist, all readings are no-detection readings,
   * or sensors are disabled.
   */
  readonly nearestReading: SensorReading | null;
}

/**
 * Dashboard summary for the nearest detection across all groups.
 */
export interface NearestSensorDetectionSummary {
  /** Sensor group that contains the nearest detection. */
  readonly group: SensorDebugGroup;

  /** Type of object or boundary detected. */
  readonly detectionType: SensorDetectionType;

  /** Raw distance in world/canvas units. */
  readonly distance: number;

  /** Dashboard-formatted distance. */
  readonly displayDistance: `${number} px`;
}

/**
 * Complete dashboard-ready sensor summary.
 */
export interface SensorDebugSummary {
  /** Sensor enabled/disabled display status. */
  readonly status: SensorDisplayStatus;

  /** Front sensor group summary. */
  readonly front: SensorGroupSummary;

  /** Left sensor group summary. */
  readonly left: SensorGroupSummary;

  /** Right sensor group summary. */
  readonly right: SensorGroupSummary;

  /** Nearest detected reading across all groups, or null when none exists. */
  readonly nearestDetection: NearestSensorDetectionSummary | null;
}

/**
 * Formats a raw sensor distance for dashboard display.
 */
function formatSensorDistance(distance: number): `${number} px` {
  if (!Number.isFinite(distance) || distance < 0) {
    throw new RangeError("Sensor distance must be a finite non-negative value.");
  }

  return `${Math.round(distance)} px`;
}

type DetectedSensorReading = Extract<SensorReading, { detected: true }>;

function isDetectedSensorReading(
  reading: SensorReading,
): reading is DetectedSensorReading {
  return reading.detected;
}

/**
 * Finds the nearest detected reading in a group.
 *
 * No-detection readings are ignored.
 */
function getNearestDetectedReading(
  readings: readonly SensorReading[],
): DetectedSensorReading | null {
  let nearest: DetectedSensorReading | null = null;

  for (const reading of readings) {
    if (!isDetectedSensorReading(reading)) {
      continue;
    }

    if (nearest === null || reading.distance < nearest.distance) {
      nearest = reading;
    }
  }

  return nearest;
}

/**
 * Summarizes one sensor group for dashboard display.
 *
 * Display rules:
 * - Disabled sensors -> "Disabled"
 * - Empty readings -> "No data"
 * - Readings with no detections -> "Clear"
 * - Detected readings -> nearest distance in pixels
 */
function summarizeGroup(
  group: SensorDebugGroup,
  readings: readonly SensorReading[],
  isEnabled: boolean,
): SensorGroupSummary {
  if (!isEnabled) {
    return {
      group,
      displayDistance: "Disabled",
      nearestReading: null,
    };
  }

  if (readings.length === 0) {
    return {
      group,
      displayDistance: "No data",
      nearestReading: null,
    };
  }

  const nearestReading = getNearestDetectedReading(readings);

  if (nearestReading === null) {
    return {
      group,
      displayDistance: "Clear",
      nearestReading: null,
    };
  }

  return {
    group,
    displayDistance: formatSensorDistance(nearestReading.distance),
    nearestReading,
  };
}

/**
 * Finds the nearest detected reading across all summarized sensor groups.
 */
function getNearestOverallDetection(
  summaries: readonly SensorGroupSummary[],
): NearestSensorDetectionSummary | null {
  let nearest: NearestSensorDetectionSummary | null = null;

  for (const summary of summaries) {
    const reading = summary.nearestReading;

    if (reading === null || !reading.detected) {
      continue;
    }

    if (nearest === null || reading.distance < nearest.distance) {
      nearest = {
        group: summary.group,
        detectionType: reading.detectionType,
        distance: reading.distance,
        displayDistance: formatSensorDistance(reading.distance),
      };
    }
  }

  return nearest;
}

/**
 * Creates a complete dashboard-ready sensor debug summary.
 *
 * Disabled sensors always override stale readings. This prevents old detection
 * values from appearing active when sensors are turned off.
 */
export function createSensorDebugSummary(params: {
  /** Current sensor state owned by the car. */
  readonly sensorState: SensorState;

  /** Current readings grouped by front, left, and right sensor regions. */
  readonly groupedReadings: GroupedSensorReadings;
}): SensorDebugSummary {
  const isEnabled = params.sensorState.config.sensorEnabled;

  const front = summarizeGroup("front", params.groupedReadings.front, isEnabled);
  const left = summarizeGroup("left", params.groupedReadings.left, isEnabled);
  const right = summarizeGroup("right", params.groupedReadings.right, isEnabled);

  return {
    status: isEnabled ? "Enabled" : "Disabled",
    front,
    left,
    right,
    nearestDetection: isEnabled ? getNearestOverallDetection([front, left, right]) : null,
  };
}
