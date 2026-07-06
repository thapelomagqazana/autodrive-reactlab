/**
 * Centralized sensor configuration for AutoDrive ReactLab.
 *
 * This module is the single source of truth for sensor tuning defaults,
 * validation limits, and safe configuration factory helpers.
 *
 * Responsibility:
 * - Define base sensor defaults.
 * - Define front sensor profile defaults.
 * - Define side sensor tuning defaults.
 * - Validate configurable sensor values.
 * - Return fresh config objects so defaults are never mutated.
 *
 * This module intentionally does not:
 * - Generate sensor rays.
 * - Detect intersections.
 * - Render sensor overlays.
 * - Read from Zustand.
 * - Implement UI controls.
 * - Persist settings.
 * - Make AI decisions.
 *
 * Units:
 * - Distances use simulation world/canvas units.
 * - Angles use radians.
 */

import { type SensorConfig, createSensorConfig } from "./sensorModel";

/**
 * Safe runtime bounds for user-tunable sensor configuration.
 *
 * These limits prevent invalid, unstable, or excessively expensive sensor
 * geometry from entering the simulation.
 */
export const SENSOR_CONFIG_LIMITS = Object.freeze({
  /** Minimum allowed ray count. */
  minRayCount: 1,

  /** Maximum allowed ray count for current Phase 2 performance expectations. */
  maxRayCount: 15,

  /** Minimum allowed ray length in world units. */
  minRayLength: 50,

  /** Maximum allowed ray length in world units. */
  maxRayLength: 500,

  /** Minimum allowed ray spread in radians. */
  minRaySpread: Number.EPSILON,

  /** Maximum allowed ray spread in radians. */
  maxRaySpread: Math.PI,

  /** Minimum allowed side ray length ratio. */
  minSideRayLengthRatio: Number.EPSILON,

  /** Exclusive upper bound for side ray length ratio. */
  maxSideRayLengthRatioExclusive: 1,
});

/**
 * Default base sensor configuration.
 *
 * This config represents the general sensor system defaults before front/side
 * profile-specific tuning is applied.
 */
export const DEFAULT_BASE_SENSOR_CONFIG: Readonly<SensorConfig> = Object.freeze({
  rayCount: 7,
  rayLength: 180,
  raySpread: Math.PI / 2,
  sensorEnabled: true,
});

/**
 * Tunable configuration for the front sensor profile.
 *
 * The front profile has a fixed semantic layout, so its defaults are kept
 * explicit instead of relying only on the base sensor config.
 */
export interface FrontSensorProfileConfig {
  /** Number of front-facing rays. */
  readonly rayCount: number;

  /** Total front field of view in radians. */
  readonly raySpread: number;
}

/**
 * Tunable configuration for side sensor behavior.
 *
 * This is configuration data, not the runtime derived side profile. Runtime
 * fields such as `frontRayLength`, `sideRayLength`, and `sensorEnabled` belong
 * in the side sensor profile module.
 */
export interface SideSensorTuningConfig {
  /** Whether side sensors should participate when sensors are enabled globally. */
  readonly sideSensorEnabled: boolean;

  /**
   * Side ray length as a ratio of base/front ray length.
   *
   * Must be greater than 0 and less than 1.
   */
  readonly sideRayLengthRatio: number;
}

/**
 * Complete sensor system configuration grouped by concern.
 */
export interface SensorSystemConfig {
  /** General sensor defaults. */
  readonly base: SensorConfig;

  /** Front-profile tuning. */
  readonly front: FrontSensorProfileConfig;

  /** Side-profile tuning. */
  readonly side: SideSensorTuningConfig;
}

/**
 * Default front sensor profile configuration.
 */
export const DEFAULT_FRONT_SENSOR_PROFILE_CONFIG: Readonly<FrontSensorProfileConfig> =
  Object.freeze({
    rayCount: 5,
    raySpread: Math.PI / 2,
  });

/**
 * Default side sensor tuning configuration.
 */
export const DEFAULT_SIDE_SENSOR_PROFILE_CONFIG: Readonly<SideSensorTuningConfig> =
  Object.freeze({
    sideSensorEnabled: true,
    sideRayLengthRatio: 0.6,
  });

/**
 * Default complete sensor system configuration.
 *
 * This object groups immutable defaults for easy discovery and documentation.
 */
export const DEFAULT_SENSOR_SYSTEM_CONFIG: Readonly<SensorSystemConfig> = Object.freeze({
  base: DEFAULT_BASE_SENSOR_CONFIG,
  front: DEFAULT_FRONT_SENSOR_PROFILE_CONFIG,
  side: DEFAULT_SIDE_SENSOR_PROFILE_CONFIG,
});

/**
 * Ensures ray count stays within supported tuning bounds.
 */
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

/**
 * Ensures ray length stays within supported tuning bounds.
 */
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

/**
 * Ensures side ray length ratio is valid.
 */
function assertSideRayLengthRatio(value: number): void {
  if (
    !Number.isFinite(value) ||
    value <= 0 ||
    value >= SENSOR_CONFIG_LIMITS.maxSideRayLengthRatioExclusive
  ) {
    throw new RangeError("sideRayLengthRatio must be greater than 0 and less than 1.");
  }
}

/**
 * Creates a validated base sensor configuration.
 *
 * Defaults are merged first, then overrides are applied, then the final config
 * is validated.
 */
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

/**
 * Creates a validated front sensor profile configuration.
 */
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

/**
 * Creates a validated side sensor tuning configuration.
 */
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

/**
 * Creates the full validated sensor system configuration.
 */
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
