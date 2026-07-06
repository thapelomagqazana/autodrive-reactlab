import {
  DEFAULT_SENSOR_CONFIG,
  type SensorConfig,
  type SensorRay,
  type SensorReading,
  assertValidSensorConfig,
} from "./sensorModel";

/**
 * Runtime sensor state owned by a car.
 *
 * This state stores configuration, generated ray geometry, and latest readings.
 * It intentionally does not generate rays, cast rays, render sensors, or make AI decisions.
 */
export interface SensorState {
  readonly config: SensorConfig;
  readonly rays: readonly SensorRay[];
  readonly readings: readonly SensorReading[];
}

/**
 * Creates a clean sensor state.
 *
 * By default:
 * - config uses DEFAULT_SENSOR_CONFIG
 * - rays are empty
 * - readings are empty
 *
 * Empty rays/readings prevent stale geometry from existing before the ray-casting
 * task is implemented.
 */
export function createInitialSensorState(
  config: SensorConfig = DEFAULT_SENSOR_CONFIG,
): SensorState {
  assertValidSensorConfig(config);

  return {
    config,
    rays: [],
    readings: [],
  };
}

/**
 * Resets sensors to default configuration and clears all runtime sensor data.
 *
 * Reset intentionally removes stale rays/readings because ray geometry and readings
 * are frame-derived runtime data.
 */
export function resetSensorState(): SensorState {
  return createInitialSensorState(DEFAULT_SENSOR_CONFIG);
}

/**
 * Replaces runtime sensor rays immutably.
 */
export function withSensorRays(
  sensorState: SensorState,
  rays: readonly SensorRay[],
): SensorState {
  assertValidSensorConfig(sensorState.config);

  return {
    ...sensorState,
    rays: [...rays],
  };
}

/**
 * Replaces runtime sensor readings immutably.
 */
export function withSensorReadings(
  sensorState: SensorState,
  readings: readonly SensorReading[],
): SensorState {
  assertValidSensorConfig(sensorState.config);

  return {
    ...sensorState,
    readings: [...readings],
  };
}

/**
 * Updates sensor configuration while clearing stale runtime data.
 *
 * Changing config invalidates previously generated rays/readings because ray count,
 * ray length, spread, or enabled state may have changed.
 */
export function withSensorConfig(
  sensorState: SensorState,
  config: SensorConfig,
): SensorState {
  void sensorState;
  assertValidSensorConfig(config);

  return createInitialSensorState(config);
}
