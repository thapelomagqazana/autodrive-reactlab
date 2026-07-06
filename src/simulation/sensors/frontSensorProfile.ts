import type { CarState } from "../vehicle/carState";
import { type SensorConfig, type SensorRay, createSensorConfig } from "./sensorModel";
import { castSensorRays } from "./raycasting";
import { DEFAULT_FRONT_SENSOR_PROFILE_CONFIG } from "./sensorConfiguration";

/**
 * Default front sensor ray count.
 *
 * Layout:
 * - index 0: wide-left
 * - index 1: front-left
 * - index 2: forward
 * - index 3: front-right
 * - index 4: wide-right
 */
export const DEFAULT_FRONT_SENSOR_RAY_COUNT =
  DEFAULT_FRONT_SENSOR_PROFILE_CONFIG.rayCount;

/**
 * Default front sensor spread.
 *
 * Math.PI / 2 creates a 90-degree front-facing detection cone.
 */
export const DEFAULT_FRONT_SENSOR_SPREAD = DEFAULT_FRONT_SENSOR_PROFILE_CONFIG.raySpread;

/**
 * Human-readable semantic labels for the default front sensor profile.
 *
 * These labels are useful for future debugging, rendering overlays, telemetry,
 * and dashboard display. They do not change the underlying ray geometry.
 */
export type FrontSensorRayLabel =
  | "wide-left"
  | "front-left"
  | "forward"
  | "front-right"
  | "wide-right";

export const DEFAULT_FRONT_SENSOR_RAY_LABELS: readonly FrontSensorRayLabel[] =
  Object.freeze(["wide-left", "front-left", "forward", "front-right", "wide-right"]);

/**
 * A generated front sensor ray enriched with a stable semantic label.
 */
export interface FrontSensorRay {
  readonly label: FrontSensorRayLabel;
  readonly ray: SensorRay;
}

/**
 * Creates the default front sensor configuration.
 *
 * This keeps front-facing tuning separate from the generic sensor model.
 */
export function createDefaultFrontSensorConfig(
  overrides: Partial<SensorConfig> = {},
): SensorConfig {
  return createSensorConfig({
    rayCount: DEFAULT_FRONT_SENSOR_RAY_COUNT,
    raySpread: DEFAULT_FRONT_SENSOR_SPREAD,
    ...overrides,
  });
}

/**
 * Generates the default front-facing sensor rays for a car.
 *
 * This function intentionally delegates geometry generation to castSensorRays().
 * It only defines the front sensor profile: ray count, spread, ordering, and
 * labels.
 */
export function castFrontSensorRays(params: {
  readonly car: Pick<CarState, "positionX" | "positionY" | "angle">;
  readonly config?: SensorConfig;
}): FrontSensorRay[] {
  const config = params.config ?? createDefaultFrontSensorConfig();

  const rays = castSensorRays({
    car: params.car,
    config,
  });

  if (rays.length === 0) {
    return [];
  }

  if (rays.length !== DEFAULT_FRONT_SENSOR_RAY_LABELS.length) {
    throw new RangeError(
      `Front sensor profile requires exactly ${DEFAULT_FRONT_SENSOR_RAY_LABELS.length} rays, received ${rays.length}.`,
    );
  }

  return rays.map((ray, index) => ({
    label: DEFAULT_FRONT_SENSOR_RAY_LABELS[index],
    ray,
  }));
}
