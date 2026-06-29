/**
 * Road boundary detection helpers for AutoDrive ReactLab.
 *
 * Responsibility:
 * - Determine whether a vehicle is inside the drivable horizontal road area.
 *
 * Non-responsibilities:
 * - No rendering.
 * - No canvas logic.
 * - No Zustand.
 * - No physics mutation.
 * - No collision response.
 */

import type { Road } from "../world";
import { getRoadLeftEdgeX, getRoadRightEdgeX } from "../world";
import type { CarState } from "../vehicle";

export interface CarRoadBoundaryCheck {
  carLeftEdgeX: number;
  carRightEdgeX: number;
  roadLeftEdgeX: number;
  roadRightEdgeX: number;
  isOffRoad: boolean;
}

/**
 * Returns the horizontal left edge of the car body.
 */
export function getCarLeftEdgeX(car: Pick<CarState, "positionX" | "width">): number {
  if (!Number.isFinite(car.positionX)) {
    throw new RangeError("car.positionX must be finite.");
  }

  if (!Number.isFinite(car.width) || car.width <= 0) {
    throw new RangeError("car.width must be a finite positive number.");
  }

  return car.positionX - car.width / 2;
}

/**
 * Returns the horizontal right edge of the car body.
 */
export function getCarRightEdgeX(car: Pick<CarState, "positionX" | "width">): number {
  if (!Number.isFinite(car.positionX)) {
    throw new RangeError("car.positionX must be finite.");
  }

  if (!Number.isFinite(car.width) || car.width <= 0) {
    throw new RangeError("car.width must be a finite positive number.");
  }

  return car.positionX + car.width / 2;
}

/**
 * Evaluates whether the car is still inside the horizontal road boundaries.
 *
 * Boundary-touching is allowed:
 * - carLeftEdgeX === roadLeftEdgeX is on-road
 * - carRightEdgeX === roadRightEdgeX is on-road
 */
export function evaluateCarRoadBoundary(
  car: Pick<CarState, "positionX" | "width">,
  road: Road,
): CarRoadBoundaryCheck {
  const carLeftEdgeX = getCarLeftEdgeX(car);
  const carRightEdgeX = getCarRightEdgeX(car);
  const roadLeftEdgeX = getRoadLeftEdgeX(road);
  const roadRightEdgeX = getRoadRightEdgeX(road);

  return {
    carLeftEdgeX,
    carRightEdgeX,
    roadLeftEdgeX,
    roadRightEdgeX,
    isOffRoad: carLeftEdgeX < roadLeftEdgeX || carRightEdgeX > roadRightEdgeX,
  };
}

/**
 * Returns true when the car body is partially or fully outside road bounds.
 *
 * This is the canonical helper for road boundary violation detection.
 */
export function isCarOffRoad(
  car: Pick<CarState, "positionX" | "width">,
  road: Road,
): boolean {
  return evaluateCarRoadBoundary(car, road).isOffRoad;
}
