/**
 * Car renderer for AutoDrive ReactLab.
 *
 * Responsibility:
 * - Draw the vehicle from the current CarState.
 *
 * Non-responsibilities:
 * - Does not mutate car state.
 * - Does not read Zustand.
 * - Does not import React.
 * - Does not apply physics.
 * - Does not update speed.
 * - Does not update position.
 * - Does not start an animation loop.
 */

import type { CarState } from "../vehicle";

/**
 * Visual styling options for the MVP car renderer.
 *
 * Theme:
 * Tesla FSD + NASA Mission Control Hybrid.
 */
export interface DrawCarOptions {
  bodyFillColor?: string;
  bodyStrokeColor?: string;
  bodyLineWidth?: number;
  frontIndicatorColor?: string;
  shadowColor?: string;
  shadowBlur?: number;
}

/**
 * Fully resolved default styling for the car renderer.
 */
export const DEFAULT_DRAW_CAR_OPTIONS: Required<DrawCarOptions> = {
  bodyFillColor: "rgb(226 232 240)",
  bodyStrokeColor: "rgb(56 189 248)",
  bodyLineWidth: 2,
  frontIndicatorColor: "rgb(14 165 233)",
  shadowColor: "rgb(56 189 248 / 0.28)",
  shadowBlur: 14,
};

/**
 * Draws the car using its center position, dimensions, and heading angle.
 *
 * Coordinate convention:
 * - car.positionX and car.positionY represent the car center.
 * - car.width and car.height are measured in pixels.
 * - car.angle is radians.
 * - angle = 0 means facing upward/north on the canvas.
 */
export function drawCar(
  context: CanvasRenderingContext2D,
  car: CarState,
  options: DrawCarOptions = {},
): void {
  const resolvedOptions = {
    ...DEFAULT_DRAW_CAR_OPTIONS,
    ...options,
  };

  assertDrawableCarState(car);

  context.save();

  context.translate(car.positionX, car.positionY);
  context.rotate(car.angle);

  context.fillStyle = resolvedOptions.bodyFillColor;
  context.strokeStyle = resolvedOptions.bodyStrokeColor;
  context.lineWidth = resolvedOptions.bodyLineWidth;
  context.shadowColor = resolvedOptions.shadowColor;
  context.shadowBlur = resolvedOptions.shadowBlur;

  context.beginPath();
  context.roundRect(
    -car.width / 2,
    -car.height / 2,
    car.width,
    car.height,
    Math.min(8, car.width / 4, car.height / 4),
  );
  context.fill();
  context.stroke();

  drawCarFrontIndicator(context, car, resolvedOptions);

  context.restore();
}

/**
 * Draws a small forward-facing indicator near the front of the car.
 *
 * Because the car is already translated and rotated by drawCar(), the indicator
 * can be drawn in local vehicle coordinates.
 */
export function drawCarFrontIndicator(
  context: CanvasRenderingContext2D,
  car: CarState,
  options: Pick<Required<DrawCarOptions>, "frontIndicatorColor">,
): void {
  const indicatorWidth = car.width * 0.45;
  const indicatorHeight = Math.max(3, car.height * 0.08);

  context.save();

  context.fillStyle = options.frontIndicatorColor;
  context.shadowBlur = 0;

  context.fillRect(
    -indicatorWidth / 2,
    -car.height / 2 + 6,
    indicatorWidth,
    indicatorHeight,
  );

  context.restore();
}

/**
 * Validates values required for rendering.
 *
 * Rendering with NaN or Infinity can poison the canvas state and create
 * extremely difficult visual bugs. Fail early instead.
 */
export function assertDrawableCarState(car: CarState): void {
  const valuesToCheck: Array<[string, number]> = [
    ["positionX", car.positionX],
    ["positionY", car.positionY],
    ["width", car.width],
    ["height", car.height],
    ["angle", car.angle],
  ];

  for (const [label, value] of valuesToCheck) {
    if (!Number.isFinite(value)) {
      throw new RangeError(`car.${label} must be finite for rendering.`);
    }
  }

  if (car.width <= 0) {
    throw new RangeError("car.width must be greater than 0 for rendering.");
  }

  if (car.height <= 0) {
    throw new RangeError("car.height must be greater than 0 for rendering.");
  }
}
