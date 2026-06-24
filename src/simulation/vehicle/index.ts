/**
 * Vehicle domain public API.
 *
 * Keep exports explicit so other modules consume vehicle state through one
 * stable boundary.
 */

export type { CarDecision, CarPosition, CarState, HeadingVector } from "./carState";

export {
  DEFAULT_CAR_ACCELERATION,
  DEFAULT_CAR_ANGLE,
  DEFAULT_CAR_MAX_REVERSE_SPEED,
  DEFAULT_CAR_MAX_SPEED,
  DEFAULT_CAR_POSITION,
  DEFAULT_CAR_SPEED,
  DEFAULT_CAR_STATE,
  DEFAULT_CAR_STEERING_ANGLE,
  DEFAULT_MAX_STEERING_ANGLE,
  TWO_PI,
  applyForwardAcceleration,
  clampSteeringAngle,
  clampCarSpeed,
  createCarPosition,
  createInitialCarState,
  degreesToRadians,
  getHeadingVector,
  isValidAccelerationValue,
  isValidCanvasPositionValue,
  isValidCarSpeedValue,
  isValidSpeedLimit,
  isValidMaxSteeringAngle,
  isValidSteeringAngle,
  normalizeHeadingAngle,
  radiansToDegrees,
  steeringInputToAngle,
} from "./carState";
