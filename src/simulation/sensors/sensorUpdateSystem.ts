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

function createRoadBoundarySegments(road: Road): readonly RoadBoundarySegment[] {
  return [
    {
      side: "left",
      start: { x: getRoadLeftEdgeX(road), y: road.topY },
      end: { x: getRoadLeftEdgeX(road), y: road.bottomY },
    },
    {
      side: "right",
      start: { x: getRoadRightEdgeX(road), y: road.topY },
      end: { x: getRoadRightEdgeX(road), y: road.bottomY },
    },
  ];
}

function createReadingsForRays(
  rays: readonly SensorRay[],
  boundaries: readonly RoadBoundarySegment[],
): SensorReading[] {
  return rays.map((ray) => {
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

function clearRuntimeSensorData(sensorState: SensorState): SensorState {
  return {
    config: sensorState.config,
    rays: [],
    readings: [],
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

  const frontRays = castFrontSensorRays({
    car,
    config: {
      ...car.sensors.config,
      rayCount: 5,
      raySpread: Math.PI / 2,
    },
  }).map((entry) => entry.ray);

  const sideRays = castSideSensorRays({
    car,
    sensorConfig: car.sensors.config,
  }).all.map((entry) => entry.ray);

  const rays = [...frontRays, ...sideRays];
  const boundaries = createRoadBoundarySegments(road);
  const readings = createReadingsForRays(rays, boundaries);

  return {
    car: {
      ...car,
      sensors: {
        config: car.sensors.config,
        rays,
        readings,
      },
    },
    sensorsUpdated: true,
  };
}
