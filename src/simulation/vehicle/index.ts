/**
 * Vehicle domain public API.
 *
 * Keep exports explicit so other modules consume vehicle state through one
 * stable boundary.
 */

export type { CarDecision, CarState } from "./carState";
export { DEFAULT_CAR_STATE, createInitialCarState } from "./carState";
