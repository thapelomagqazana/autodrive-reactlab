/**
 * Vehicle domain public API.
 *
 * Keep exports explicit so other modules consume vehicle state through one
 * stable boundary.
 */

export type {
  CarDecision,
  CarMovementLimits,
  CarPosition,
  CarState,
  HeadingVector,
} from "./carState";

export {
  DEFAULT_CAR_ACCELERATION,
  DEFAULT_CAR_ANGLE,
  DEFAULT_CAR_MAX_REVERSE_SPEED,
  DEFAULT_CAR_MAX_SPEED,
  DEFAULT_CAR_MOVEMENT_LIMITS,
  DEFAULT_CAR_POSITION,
  DEFAULT_CAR_SPEED,
  DEFAULT_CAR_STATE,
  DEFAULT_CAR_STEERING_ANGLE,
  DEFAULT_MAX_STEERING_ANGLE,
  TWO_PI,
  assertValidCarMovementLimits,
  applyForwardAcceleration,
  clampSteeringAngle,
  clampCarSpeed,
  clampCarSpeedToMovementLimits,
  createCarPosition,
  createInitialCarState,
  degreesToRadians,
  getHeadingVector,
  isPositiveSpeedLimit,
  isValidAccelerationValue,
  isValidCarMovementLimits,
  isValidCanvasPositionValue,
  isValidCarSpeedValue,
  isValidSpeedLimit,
  isValidMaxSteeringAngle,
  isValidSteeringAngle,
  normalizeHeadingAngle,
  radiansToDegrees,
  steeringInputToAngle,
} from "./carState";

export type {
  CarBounds,
  CarDimensions,
  CreateInitialCarOptions,
} from "./createInitialCar";

export {
  DEFAULT_INITIAL_CAR_DIMENSIONS,
  DEFAULT_INITIAL_CAR_HEIGHT,
  DEFAULT_INITIAL_CAR_WIDTH,
  DEFAULT_START_OFFSET_FROM_BOTTOM,
  assertCarFitsInsideLane,
  assertValidCarDimensions,
  createInitialCar,
  getCarBoundsFromCenter,
  isValidCarDimension,
} from "./createInitialCar";
