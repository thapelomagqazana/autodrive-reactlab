/**
 * Centralized sensor configuration for AutoDrive ReactLab.
 *
 * This module owns validated, type-safe configuration defaults for base,
 * front, and side sensor profiles.
 */

import { type SensorConfig, createSensorConfig } from "./sensorModel";

export const SENSOR_CONFIG_LIMITS = Object.freeze({
  minRayCount: 1,
  maxRayCount: 15,
  minRayLength: 50,
  maxRayLength: 500,
  minRaySpread: Number.EPSILON,
  maxRaySpread: Math.PI,
  minSideRayLengthRatio: Number.EPSILON,
  maxSideRayLengthRatioExclusive: 1,
});

export const DEFAULT_BASE_SENSOR_CONFIG: Readonly<SensorConfig> = Object.freeze({
  rayCount: 7,
  rayLength: 180,
  raySpread: Math.PI / 2,
  sensorEnabled: true,
});

export interface FrontSensorProfileConfig {
  readonly rayCount: number;
  readonly raySpread: number;
}

export interface SideSensorTuningConfig {
  readonly sideSensorEnabled: boolean;
  readonly sideRayLengthRatio: number;
}

export interface SensorSystemConfig {
  readonly base: SensorConfig;
  readonly front: FrontSensorProfileConfig;
  readonly side: SideSensorTuningConfig;
}

export const DEFAULT_FRONT_SENSOR_PROFILE_CONFIG: Readonly<FrontSensorProfileConfig> =
  Object.freeze({
    rayCount: 5,
    raySpread: Math.PI / 2,
  });

export const DEFAULT_SIDE_SENSOR_PROFILE_CONFIG: Readonly<SideSensorTuningConfig> =
  Object.freeze({
    sideSensorEnabled: true,
    sideRayLengthRatio: 0.6,
  });

export const DEFAULT_SENSOR_SYSTEM_CONFIG: Readonly<SensorSystemConfig> = Object.freeze({
  base: DEFAULT_BASE_SENSOR_CONFIG,
  front: DEFAULT_FRONT_SENSOR_PROFILE_CONFIG,
  side: DEFAULT_SIDE_SENSOR_PROFILE_CONFIG,
});

function assertRayCountWithinTuningBounds(rayCount: number): void {
  if (
    rayCount < SENSOR_CONFIG_LIMITS.minRayCount ||
    rayCount > SENSOR_CONFIG_LIMITS.maxRayCount
  ) {
    throw new RangeError(
      `rayCount must be between ${SENSOR_CONFIG_LIMITS.minRayCount} and ${SENSOR_CONFIG_LIMITS.maxRayCount}.`,
    );
  }
}

function assertRayLengthWithinTuningBounds(rayLength: number): void {
  if (
    rayLength < SENSOR_CONFIG_LIMITS.minRayLength ||
    rayLength > SENSOR_CONFIG_LIMITS.maxRayLength
  ) {
    throw new RangeError(
      `rayLength must be between ${SENSOR_CONFIG_LIMITS.minRayLength} and ${SENSOR_CONFIG_LIMITS.maxRayLength}.`,
    );
  }
}

function assertSideRayLengthRatio(value: number): void {
  if (
    !Number.isFinite(value) ||
    value <= 0 ||
    value >= SENSOR_CONFIG_LIMITS.maxSideRayLengthRatioExclusive
  ) {
    throw new RangeError("sideRayLengthRatio must be greater than 0 and less than 1.");
  }
}

export function createBaseSensorConfig(
  overrides: Partial<SensorConfig> = {},
): SensorConfig {
  const config = createSensorConfig({
    ...DEFAULT_BASE_SENSOR_CONFIG,
    ...overrides,
  });

  assertRayCountWithinTuningBounds(config.rayCount);
  assertRayLengthWithinTuningBounds(config.rayLength);

  return config;
}

export function createFrontSensorProfileConfig(
  overrides: Partial<FrontSensorProfileConfig> = {},
): FrontSensorProfileConfig {
  const config = {
    ...DEFAULT_FRONT_SENSOR_PROFILE_CONFIG,
    ...overrides,
  };

  const validated = createSensorConfig({
    ...DEFAULT_BASE_SENSOR_CONFIG,
    rayCount: config.rayCount,
    raySpread: config.raySpread,
  });

  assertRayCountWithinTuningBounds(validated.rayCount);

  return {
    rayCount: validated.rayCount,
    raySpread: validated.raySpread,
  };
}

export function createSideSensorProfileConfig(
  overrides: Partial<SideSensorTuningConfig> = {},
): SideSensorTuningConfig {
  const config = {
    ...DEFAULT_SIDE_SENSOR_PROFILE_CONFIG,
    ...overrides,
  };

  if (typeof config.sideSensorEnabled !== "boolean") {
    throw new TypeError("sideSensorEnabled must be a boolean.");
  }

  assertSideRayLengthRatio(config.sideRayLengthRatio);

  return {
    sideSensorEnabled: config.sideSensorEnabled,
    sideRayLengthRatio: config.sideRayLengthRatio,
  };
}

export function createSensorSystemConfig(
  overrides: {
    readonly base?: Partial<SensorConfig>;
    readonly front?: Partial<FrontSensorProfileConfig>;
    readonly side?: Partial<SideSensorTuningConfig>;
  } = {},
): SensorSystemConfig {
  return {
    base: createBaseSensorConfig(overrides.base),
    front: createFrontSensorProfileConfig(overrides.front),
    side: createSideSensorProfileConfig(overrides.side),
  };
}
