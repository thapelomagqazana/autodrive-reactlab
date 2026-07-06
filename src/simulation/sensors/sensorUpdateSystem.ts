/**
 * Sensor update loop for AutoDrive ReactLab.
 *
 * This module integrates generated sensor rays with road-edge detection.
 *
 * It does not:
 * - update physics
 * - render canvas overlays
 * - read Zustand directly
 * - make AI decisions
 */

import type { Road } from "../world";
import { getRoadLeftEdgeX, getRoadRightEdgeX } from "../world";
import type { CarState } from "../vehicle";
import type { SensorRay, SensorReading } from "./sensorModel";
import type { SensorState } from "./sensorState";
import { createNoDetectionSensorReading } from "./sensorModel";
import { castFrontSensorRays } from "./frontSensorProfile";
import { castSideSensorRays } from "./sideSensorProfile";
import {
  detectClosestRoadEdgeIntersection,
  type RoadBoundarySegment,
} from "./roadEdgeDetection";
import { createSensorReadingFromCandidate } from "./sensorDistance";

export type SensorUpdateStatus = "running" | "paused" | "idle";

export interface SensorFrameUpdateInput {
  readonly status: SensorUpdateStatus;
  readonly car: CarState;
  readonly road: Road;
}

export interface SensorFrameUpdateResult {
  readonly car: CarState;
  readonly sensorsUpdated: boolean;
}

function createReadingsForLabelledRays(
  rays: readonly { readonly ray: SensorRay }[],
  boundaries: readonly RoadBoundarySegment[],
): SensorReading[] {
  return rays.map(({ ray }) => {
    const hit = detectClosestRoadEdgeIntersection(ray, boundaries);

    if (hit === null) {
      return createNoDetectionSensorReading(ray.index);
    }

    return createSensorReadingFromCandidate(ray, {
      detectionType: hit.detectionType,
      point: hit.point,
    });
  });
}

function createRoadBoundarySegments(
  road: Road,
  car: Pick<CarState, "positionY" | "sensors">,
): readonly RoadBoundarySegment[] {
  const leftX = getRoadLeftEdgeX(road);
  const rightX = getRoadRightEdgeX(road);

  const rayLength = car.sensors.config.rayLength;
  const padding = rayLength * 2;

  const topY = Math.min(road.topY, car.positionY - padding);
  const bottomY = Math.max(road.bottomY, car.positionY + padding);

  return [
    {
      side: "left",
      start: { x: leftX, y: topY },
      end: { x: leftX, y: bottomY },
    },
    {
      side: "right",
      start: { x: rightX, y: topY },
      end: { x: rightX, y: bottomY },
    },
  ];
}

function clearRuntimeSensorData(sensorState: SensorState): SensorState {
  return {
    config: sensorState.config,
    rays: [],
    readings: [],
    readingGroups: {
      front: [],
      left: [],
      right: [],
    },
  };
}

/**
 * Updates sensor rays and road-edge readings for one simulation frame.
 *
 * Rules:
 * - running + enabled: recalculate rays/readings
 * - running + disabled: clear rays/readings
 * - paused/idle: preserve existing sensor state
 */
export function updateSensorsForFrame({
  status,
  car,
  road,
}: SensorFrameUpdateInput): SensorFrameUpdateResult {
  if (status !== "running") {
    return {
      car,
      sensorsUpdated: false,
    };
  }

  if (!car.sensors.config.sensorEnabled) {
    return {
      car: {
        ...car,
        sensors: clearRuntimeSensorData(car.sensors),
      },
      sensorsUpdated: true,
    };
  }

  const frontRayEntries = castFrontSensorRays({
    car,
    config: {
      ...car.sensors.config,
      rayCount: 5,
      raySpread: Math.PI / 2,
    },
  });

  const sideRayGroups = castSideSensorRays({
    car,
    sensorConfig: car.sensors.config,
  });

  const boundaries = createRoadBoundarySegments(road, car);

  const frontReadings = createReadingsForLabelledRays(frontRayEntries, boundaries);
  const leftReadings = createReadingsForLabelledRays(sideRayGroups.left, boundaries);
  const rightReadings = createReadingsForLabelledRays(sideRayGroups.right, boundaries);

  const rays = [
    ...frontRayEntries.map((entry) => entry.ray),
    ...sideRayGroups.all.map((entry) => entry.ray),
  ];

  const readings = [...frontReadings, ...leftReadings, ...rightReadings];

  return {
    car: {
      ...car,
      sensors: {
        config: car.sensors.config,
        rays,
        readings,
        readingGroups: {
          front: frontReadings,
          left: leftReadings,
          right: rightReadings,
        },
      },
    },
    sensorsUpdated: true,
  };
}
