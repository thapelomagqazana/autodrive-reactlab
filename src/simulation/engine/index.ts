export type { DrawCarOptions } from "./carRenderer";

export {
  DEFAULT_DRAW_CAR_OPTIONS,
  applyCarTransform,
  assertDrawableCarDimensions,
  assertDrawableCarState,
  assertDrawableCarTransform,
  drawCar,
  drawCarBody,
  drawCarFrontIndicator,
} from "./carRenderer";

export type { CarPhysicsInput, CarPositionUpdate } from "./physics";

export {
  NEUTRAL_CAR_PHYSICS_INPUT,
  applyAccelerationToSpeed,
  applyFrictionToSpeed,
  assertValidDeltaTimeSeconds,
  calculateTravelDistance,
  clampCarPhysicsSpeed,
  clampSpeed,
  isValidDeltaTimeSeconds,
  resolveCarFriction,
  updateCarPhysics,
  updatePositionUsingSpeedAndHeading,
} from "./physics";

export type {
  DrawSimulationFrameOptions,
  RoadCarCompositionResult,
} from "./simulationFrameRenderer";

export {
  assertCarAppearsOnRoad,
  drawSimulationFrame,
  evaluateRoadCarComposition,
} from "./simulationFrameRenderer";
