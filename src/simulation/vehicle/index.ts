/**
 * Vehicle domain public API.
 *
 * Keep exports explicit so other modules consume vehicle state through one
 * stable boundary.
 */

export type { CarDecision, CarPosition, CarState } from "./carState";

export {
  DEFAULT_CAR_POSITION,
  DEFAULT_CAR_STATE,
  createCarPosition,
  createInitialCarState,
  isValidCanvasPositionValue,
} from "./carState";
