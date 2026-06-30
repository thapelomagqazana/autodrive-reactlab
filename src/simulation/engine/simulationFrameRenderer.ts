/**
 * Simulation frame renderer for AutoDrive ReactLab.
 *
 * Responsibility:
 * - Compose the visible MVP simulation frame.
 * - Draw road before car.
 * - Verify the default car starts inside the road.
 *
 * Non-responsibilities:
 * - No React imports.
 * - No Zustand imports.
 * - No physics updates.
 * - No car movement.
 * - No requestAnimationFrame ownership.
 */

import type { Road } from "../world";
import {
  getRoadLeftEdgeX,
  getRoadRightEdgeX,
  getLaneCenterX,
  isValidLaneIndex,
} from "../world";
import type { CarState } from "../vehicle";
import { drawCar, type DrawCarOptions } from "./carRenderer";
import { drawRoad, type DrawRoadOptions } from "./roadRenderer";
import type { CameraState } from "../camera";
import { applyCameraTransform } from "./cameraRenderer";

export interface DrawSimulationFrameOptions {
  road?: DrawRoadOptions;
  car?: DrawCarOptions;

  /**
   * Camera used for world-space rendering.
   *
   * Road and car are both rendered under the same transform so their
   * relationship remains visually correct.
   */
  camera?: CameraState;
}

export interface RoadCarCompositionResult {
  carCenterInsideRoad: boolean;
  carFullyInsideRoad: boolean;
  carCenterAlignedWithLane: boolean;
}

/**
 * Draws the simulation world layer.
 *
 * Important:
 * - The renderer must not reject off-road vehicles.
 * - Off-road detection belongs to roadBoundary.ts.
 * - The vehicle remains visible and recoverable even during boundary violations.
 */
export function drawSimulationFrame(
  context: CanvasRenderingContext2D,
  road: Road,
  car: CarState,
  options: DrawSimulationFrameOptions = {},
): void {
  context.save();

  try {
    if (options.camera) {
      applyCameraTransform(context, options.camera);
    }

    drawRoad(context, road, options.road);
    drawCar(context, car, options.car);
  } finally {
    context.restore();
  }
}

/**
 * Checks whether the car appears in a valid road/lane position.
 *
 * This should be used for initial spawn validation, not for requiring the car
 * to stay lane-centered during active driving.
 */
export function evaluateRoadCarComposition(
  road: Road,
  car: CarState,
  laneIndex: number,
): RoadCarCompositionResult {
  if (!isValidLaneIndex(road, laneIndex)) {
    throw new RangeError(
      `laneIndex must be an integer between 0 and ${road.laneCount - 1}.`,
    );
  }

  const leftEdgeX = getRoadLeftEdgeX(road);
  const rightEdgeX = getRoadRightEdgeX(road);
  const laneCenterX = getLaneCenterX(road, laneIndex);

  const carLeft = car.positionX - car.width / 2;
  const carRight = car.positionX + car.width / 2;

  return {
    carCenterInsideRoad: car.positionX >= leftEdgeX && car.positionX <= rightEdgeX,

    carFullyInsideRoad: carLeft >= leftEdgeX && carRight <= rightEdgeX,

    carCenterAlignedWithLane: Math.abs(car.positionX - laneCenterX) <= 0.001,
  };
}

/**
 * Fails early if the initial road/car composition is invalid.
 */
export function assertCarAppearsOnRoad(
  road: Road,
  car: CarState,
  laneIndex = Math.floor((road.laneCount - 1) / 2),
): void {
  const result = evaluateRoadCarComposition(road, car, laneIndex);

  if (!result.carCenterInsideRoad) {
    throw new RangeError("Car center must start inside road boundaries.");
  }

  if (!result.carFullyInsideRoad) {
    throw new RangeError("Car body must start fully inside road boundaries.");
  }

  if (!result.carCenterAlignedWithLane) {
    throw new RangeError("Car center must align with selected lane center.");
  }
}

/**
 * Runtime-safe render validation.
 *
 * Unlike initial spawn validation, this does not require lane-center alignment.
 */
export function assertCarIsRenderableOnRoad(road: Road, car: CarState): void {
  const leftEdgeX = getRoadLeftEdgeX(road);
  const rightEdgeX = getRoadRightEdgeX(road);

  const carLeft = car.positionX - car.width / 2;
  const carRight = car.positionX + car.width / 2;

  if (car.positionX < leftEdgeX || car.positionX > rightEdgeX) {
    throw new RangeError("Car center must remain inside road boundaries.");
  }

  if (carLeft < leftEdgeX || carRight > rightEdgeX) {
    throw new RangeError("Car body must remain fully inside road boundaries.");
  }
}
