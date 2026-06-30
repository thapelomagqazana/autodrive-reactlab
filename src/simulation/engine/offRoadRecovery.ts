/**
 * Severe off-road recovery detection for AutoDrive ReactLab.
 *
 * Responsibility:
 * - Detect when the vehicle has gone too far beyond the road to remain
 *   safely recoverable by steering.
 *
 * Non-responsibilities:
 * - Does not reset state directly.
 * - Does not mutate car or road.
 * - Does not render warnings.
 * - Does not apply speed penalties.
 */

import type { Road } from "../world";
import { getRoadLeftEdgeX, getRoadRightEdgeX } from "../world";
import type { CarState } from "../vehicle";

export const DEFAULT_MAXIMUM_OFF_ROAD_DISTANCE = 300;

export function isValidMaximumOffRoadDistance(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

export function assertValidMaximumOffRoadDistance(value: number): void {
  if (!isValidMaximumOffRoadDistance(value)) {
    throw new RangeError("maximumOffRoadDistance must be finite and non-negative.");
  }
}

/**
 * Returns true when the car center has exceeded the severe recovery threshold.
 *
 * Slight off-road movement is allowed. Recovery only triggers when the center
 * moves beyond:
 *
 * left road edge - maximumOffRoadDistance
 * right road edge + maximumOffRoadDistance
 */
export function shouldRecoverFromSevereRoadDeparture(
  car: Pick<CarState, "positionX">,
  road: Road,
  maximumOffRoadDistance = DEFAULT_MAXIMUM_OFF_ROAD_DISTANCE,
): boolean {
  if (!Number.isFinite(car.positionX)) {
    throw new RangeError("car.positionX must be finite.");
  }

  assertValidMaximumOffRoadDistance(maximumOffRoadDistance);

  const leftRecoveryLimit = getRoadLeftEdgeX(road) - maximumOffRoadDistance;
  const rightRecoveryLimit = getRoadRightEdgeX(road) + maximumOffRoadDistance;

  return car.positionX < leftRecoveryLimit || car.positionX > rightRecoveryLimit;
}
