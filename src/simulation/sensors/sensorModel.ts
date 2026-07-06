/**
 * Ray-based sensor domain model for AutoDrive ReactLab.
 *
 * This module is intentionally framework-independent.
 *
 * It must not import React, Zustand, Canvas APIs, renderer modules, physics
 * update functions, browser APIs, or AI modules.
 *
 * All coordinates are world-space simulation coordinates.
 * All angles are radians.
 * All distances are simulation world units.
 */

export type SensorDetectionType =
  | "obstacle"
  | "road-boundary"
  | "lane-boundary"
  | "traffic-light"
  | "vehicle"
  | "pedestrian"
  | "wall";

export interface SensorPoint {
  readonly x: number;
  readonly y: number;
}

export interface SensorConfig {
  readonly rayCount: number;
  readonly rayLength: number;
  readonly raySpread: number;
  readonly sensorEnabled: boolean;
}

export interface SensorRay {
  readonly index: number;
  readonly start: SensorPoint;
  readonly end: SensorPoint;
  readonly angle: number;
  readonly maxLength: number;
}

export type SensorReading =
  | {
      readonly rayIndex: number;
      readonly detected: false;
      readonly detectionType: null;
      readonly distance: null;
      readonly point: null;
    }
  | {
      readonly rayIndex: number;
      readonly detected: true;
      readonly detectionType: SensorDetectionType;
      readonly distance: number;
      readonly point: SensorPoint;
    };

export const DEFAULT_SENSOR_CONFIG: SensorConfig = Object.freeze({
  rayCount: 7,
  rayLength: 180,
  raySpread: Math.PI / 2,
  sensorEnabled: true,
});

export function isFiniteSensorNumber(value: number): boolean {
  return Number.isFinite(value);
}

export function isValidRayCount(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

export function isValidRayLength(value: number): boolean {
  return isFiniteSensorNumber(value) && value > 0;
}

export function isValidRaySpread(value: number): boolean {
  return isFiniteSensorNumber(value) && value > 0 && value <= Math.PI;
}

export function isValidSensorEnabled(value: unknown): value is boolean {
  return typeof value === "boolean";
}

export function isValidSensorPoint(point: SensorPoint): boolean {
  return isFiniteSensorNumber(point.x) && isFiniteSensorNumber(point.y);
}

export function assertValidRayCount(rayCount: number): void {
  if (!isValidRayCount(rayCount)) {
    throw new RangeError(
      `Invalid sensor rayCount: expected a positive integer, received ${String(rayCount)}.`,
    );
  }
}

export function assertValidRayLength(rayLength: number): void {
  if (!isValidRayLength(rayLength)) {
    throw new RangeError(
      `Invalid sensor rayLength: expected a positive finite number, received ${String(rayLength)}.`,
    );
  }
}

export function assertValidRaySpread(raySpread: number): void {
  if (!isValidRaySpread(raySpread)) {
    throw new RangeError(
      `Invalid sensor raySpread: expected a positive finite number <= Math.PI, received ${String(
        raySpread,
      )}.`,
    );
  }
}

export function assertValidSensorPoint(point: SensorPoint, label = "sensor point"): void {
  if (!isValidSensorPoint(point)) {
    throw new RangeError(
      `Invalid ${label}: expected finite x/y world-space coordinates, received x=${String(
        point.x,
      )}, y=${String(point.y)}.`,
    );
  }
}

export function assertValidSensorConfig(config: SensorConfig): void {
  assertValidRayCount(config.rayCount);
  assertValidRayLength(config.rayLength);
  assertValidRaySpread(config.raySpread);

  if (!isValidSensorEnabled(config.sensorEnabled)) {
    throw new TypeError(
      `Invalid sensorEnabled: expected boolean, received ${typeof config.sensorEnabled}.`,
    );
  }
}

export function createSensorConfig(overrides: Partial<SensorConfig> = {}): SensorConfig {
  const config: SensorConfig = {
    ...DEFAULT_SENSOR_CONFIG,
    ...overrides,
  };

  assertValidSensorConfig(config);

  return config;
}

export function createSensorPoint(x: number, y: number): SensorPoint {
  const point: SensorPoint = { x, y };
  assertValidSensorPoint(point);
  return point;
}

export function createNoDetectionSensorReading(rayIndex: number): SensorReading {
  assertValidRayIndex(rayIndex);

  return {
    rayIndex,
    detected: false,
    detectionType: null,
    distance: null,
    point: null,
  };
}

export function createDetectedSensorReading(params: {
  readonly rayIndex: number;
  readonly detectionType: SensorDetectionType;
  readonly distance: number;
  readonly point: SensorPoint;
}): SensorReading {
  assertValidRayIndex(params.rayIndex);
  assertValidDetectionDistance(params.distance);
  assertValidSensorPoint(params.point, "sensor detection point");

  return {
    rayIndex: params.rayIndex,
    detected: true,
    detectionType: params.detectionType,
    distance: params.distance,
    point: params.point,
  };
}

export function assertValidRayIndex(rayIndex: number): void {
  if (!Number.isInteger(rayIndex) || rayIndex < 0) {
    throw new RangeError(
      `Invalid sensor rayIndex: expected a non-negative integer, received ${String(rayIndex)}.`,
    );
  }
}

export function assertValidDetectionDistance(distance: number): void {
  if (!Number.isFinite(distance) || distance < 0) {
    throw new RangeError(
      `Invalid sensor detection distance: expected a non-negative finite number, received ${String(
        distance,
      )}.`,
    );
  }
}
