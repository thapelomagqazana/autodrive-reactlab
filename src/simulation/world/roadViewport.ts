/**
 * Fixed road viewport helpers for AutoDrive ReactLab.
 *
 * Phase 1 MVP rule:
 * - The road is fixed on the canvas.
 * - No camera scrolling.
 * - No world translation.
 * - No parallax.
 * - No road regeneration every animation frame.
 *
 * The road may be recalculated only when viewport/canvas dimensions change.
 */

import { DEFAULT_ROAD_LANE_COUNT, DEFAULT_ROAD_WIDTH, type Road } from "./road";

/**
 * Canvas viewport dimensions used to derive fixed road placement.
 */
export interface RoadViewportDimensions {
  /** Logical canvas width in CSS pixels. */
  width: number;

  /** Logical canvas height in CSS pixels. */
  height: number;
}

/**
 * Options for creating a fixed MVP road from the current canvas viewport.
 */
export interface CreateFixedRoadOptions {
  /** Road width in pixels. Defaults to the canonical MVP road width. */
  width?: number;

  /** Lane count. Defaults to the canonical MVP lane count. */
  laneCount?: number;

  /** Extra road extension above the visible viewport. */
  topExtension?: number;

  /** Extra road extension below the visible viewport. */
  bottomExtension?: number;
}

export const DEFAULT_ROAD_TOP_EXTENSION = 2_000;
export const DEFAULT_ROAD_BOTTOM_EXTENSION = 0;

/**
 * Returns true when a viewport dimension is safe for layout calculations.
 */
export function isValidViewportDimension(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

/**
 * Validates canvas dimensions before deriving road placement.
 */
export function assertValidRoadViewportDimensions(
  dimensions: RoadViewportDimensions,
): void {
  if (!isValidViewportDimension(dimensions.width)) {
    throw new RangeError("Viewport width must be a finite positive number.");
  }

  if (!isValidViewportDimension(dimensions.height)) {
    throw new RangeError("Viewport height must be a finite positive number.");
  }
}

/**
 * Creates a fixed road model centered inside the current canvas viewport.
 *
 * This function is pure and deterministic:
 * same dimensions + same options = same road.
 *
 * It should be called when canvas dimensions change, not every animation frame.
 */
export function createFixedRoadForViewport(
  dimensions: RoadViewportDimensions,
  options: CreateFixedRoadOptions = {},
): Road {
  assertValidRoadViewportDimensions(dimensions);

  const roadWidth = options.width ?? DEFAULT_ROAD_WIDTH;
  const laneCount = options.laneCount ?? DEFAULT_ROAD_LANE_COUNT;
  const topExtension = options.topExtension ?? DEFAULT_ROAD_TOP_EXTENSION;
  const bottomExtension = options.bottomExtension ?? DEFAULT_ROAD_BOTTOM_EXTENSION;

  if (!Number.isFinite(roadWidth) || roadWidth <= 0) {
    throw new RangeError("Road width must be a finite positive number.");
  }

  if (!Number.isInteger(laneCount) || laneCount <= 0) {
    throw new RangeError("Lane count must be a positive integer.");
  }

  if (!Number.isFinite(topExtension) || topExtension < 0) {
    throw new RangeError("Top extension must be a finite non-negative number.");
  }

  if (!Number.isFinite(bottomExtension) || bottomExtension < 0) {
    throw new RangeError("Bottom extension must be a finite non-negative number.");
  }

  return {
    centerX: dimensions.width / 2,
    width: roadWidth,
    laneCount,
    topY: -topExtension,
    bottomY: dimensions.height + bottomExtension,
  };
}

/**
 * Returns true when the road is horizontally centered in the viewport.
 */
export function isRoadCenteredInViewport(
  road: Road,
  dimensions: RoadViewportDimensions,
): boolean {
  assertValidRoadViewportDimensions(dimensions);

  return road.centerX === dimensions.width / 2;
}
