/**
 * Vehicle domain public API.
 *
 * Keep exports explicit so other modules consume vehicle state through one
 * stable boundary.
 */

export type { CarDecision, CarPosition, CarState } from "./carState";

export {
  DEFAULT_CAR_MAX_REVERSE_SPEED,
  DEFAULT_CAR_MAX_SPEED,
  DEFAULT_CAR_POSITION,
  DEFAULT_CAR_SPEED,
  DEFAULT_CAR_STATE,
  clampCarSpeed,
  createCarPosition,
  createInitialCarState,
  isValidCanvasPositionValue,
  isValidCarSpeedValue,
  isValidSpeedLimit,
} from "./carState";
