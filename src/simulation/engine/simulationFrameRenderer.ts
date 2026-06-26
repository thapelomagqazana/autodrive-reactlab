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

export interface DrawSimulationFrameOptions {
  road?: DrawRoadOptions;
  car?: DrawCarOptions;
}

export interface RoadCarCompositionResult {
  carCenterInsideRoad: boolean;
  carFullyInsideRoad: boolean;
  carCenterAlignedWithLane: boolean;
}

/**
 * Draws the MVP simulation frame in deterministic visual order.
 *
 * Render order:
 * 1. Road
 * 2. Car
 */
export function drawSimulationFrame(
  context: CanvasRenderingContext2D,
  road: Road,
  car: CarState,
  options: DrawSimulationFrameOptions = {},
): void {
  assertCarAppearsOnRoad(road, car);

  drawRoad(context, road, options.road);
  drawCar(context, car, options.car);
}

/**
 * Checks whether the car appears in a valid road/lane position.
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

    carCenterAlignedWithLane: car.positionX === laneCenterX,
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
