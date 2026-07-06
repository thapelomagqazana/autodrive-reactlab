import type { CarState } from "../vehicle/carState";
import {
  type SensorConfig,
  type SensorPoint,
  type SensorRay,
  assertValidRayCount,
  assertValidRayLength,
  assertValidRaySpread,
  assertValidSensorConfig,
  createSensorPoint,
} from "./sensorModel";

/**
 * Minimal car pose required for deterministic sensor ray generation.
 *
 * This intentionally avoids depending on the full CarState where possible.
 */
export interface SensorRaycastPose {
  readonly positionX: number;
  readonly positionY: number;
  readonly angle: number;
}

/**
 * Parameters required to generate one sensor ray.
 */
export interface CastRayParams {
  readonly origin: SensorPoint;
  readonly angle: number;
  readonly rayLength: number;
  readonly index: number;
}

/**
 * Parameters required to generate all sensor rays for a car.
 */
export interface CastSensorRaysParams {
  readonly car: Pick<CarState, "positionX" | "positionY" | "angle">;
  readonly config: SensorConfig;
}

/**
 * Linearly interpolates between two numbers.
 *
 * This helper is used to distribute sensor ray angles evenly across a sensor
 * spread. It is intentionally generic and pure.
 */
export function lerp(start: number, end: number, t: number): number {
  if (!Number.isFinite(start)) {
    throw new RangeError("lerp start must be a finite number.");
  }

  if (!Number.isFinite(end)) {
    throw new RangeError("lerp end must be a finite number.");
  }

  if (!Number.isFinite(t)) {
    throw new RangeError("lerp t must be a finite number.");
  }

  return start + (end - start) * t;
}

/**
 * Converts a canvas-space heading angle into a unit direction vector.
 *
 * Project convention:
 * - 0 radians points upward/north.
 * - Math.PI / 2 points right/east.
 * - Math.PI points downward/south.
 * - Positive rotation is clockwise.
 */
export function getSensorDirectionVector(angle: number): SensorPoint {
  if (!Number.isFinite(angle)) {
    throw new RangeError("sensor ray angle must be a finite radian value.");
  }

  return createSensorPoint(Math.sin(angle), -Math.cos(angle));
}

/**
 * Generates one sensor ray from an origin, angle, ray length, and index.
 *
 * This function only creates geometry. It does not detect objects.
 */
export function castRay({ origin, angle, rayLength, index }: CastRayParams): SensorRay {
  assertValidRayLength(rayLength);

  if (!Number.isInteger(index) || index < 0) {
    throw new RangeError(
      `sensor ray index must be a non-negative integer, received ${String(index)}.`,
    );
  }

  const direction = getSensorDirectionVector(angle);

  return {
    index,
    start: createSensorPoint(origin.x, origin.y),
    end: createSensorPoint(
      origin.x + direction.x * rayLength,
      origin.y + direction.y * rayLength,
    ),
    angle,
    maxLength: rayLength,
  };
}

/**
 * Generates deterministic sensor rays for a car.
 *
 * Ray order:
 * - leftmost ray first
 * - center ray near the middle
 * - rightmost ray last
 *
 * With the project clockwise angle convention:
 * - left side uses smaller angle values relative to heading
 * - right side uses larger angle values relative to heading
 *
 * Disabled sensors return an empty ray array.
 */
export function castSensorRays({ car, config }: CastSensorRaysParams): SensorRay[] {
  assertValidSensorConfig(config);

  if (!Number.isFinite(car.positionX)) {
    throw new RangeError("car.positionX must be finite.");
  }

  if (!Number.isFinite(car.positionY)) {
    throw new RangeError("car.positionY must be finite.");
  }

  if (!Number.isFinite(car.angle)) {
    throw new RangeError("car.angle must be finite.");
  }

  if (!config.sensorEnabled) {
    return [];
  }

  assertValidRayCount(config.rayCount);
  assertValidRayLength(config.rayLength);
  assertValidRaySpread(config.raySpread);

  const origin = createSensorPoint(car.positionX, car.positionY);

  if (config.rayCount === 1) {
    return [
      castRay({
        origin,
        angle: car.angle,
        rayLength: config.rayLength,
        index: 0,
      }),
    ];
  }

  const halfSpread = config.raySpread / 2;
  const leftmostAngle = car.angle - halfSpread;
  const rightmostAngle = car.angle + halfSpread;

  return Array.from({ length: config.rayCount }, (_, index) => {
    const t = index / (config.rayCount - 1);
    const angle = lerp(leftmostAngle, rightmostAngle, t);

    return castRay({
      origin,
      angle,
      rayLength: config.rayLength,
      index,
    });
  });
}
