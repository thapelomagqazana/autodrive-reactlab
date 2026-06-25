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
 * Draws the full MVP car.
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

  drawCarBody(context, car, resolvedOptions);
  drawCarFrontIndicator(context, car, resolvedOptions);

  context.restore();
}

/**
 * Applies the vehicle-local transform.
 *
 * This function intentionally does not call save() or restore().
 * The caller owns canvas state boundaries.
 */
export function applyCarTransform(
  context: CanvasRenderingContext2D,
  car: Pick<CarState, "positionX" | "positionY" | "angle">,
): void {
  assertDrawableCarTransform(car);

  context.translate(car.positionX, car.positionY);
  context.rotate(car.angle);
}

/**
 * Draws the rectangular car body in local vehicle coordinates.
 *
 * This function assumes the caller has already translated the context to the
 * car center and applied the car heading rotation.
 */
export function drawCarBody(
  context: CanvasRenderingContext2D,
  car: Pick<CarState, "width" | "height">,
  options: Pick<
    Required<DrawCarOptions>,
    "bodyFillColor" | "bodyStrokeColor" | "bodyLineWidth" | "shadowColor" | "shadowBlur"
  > = DEFAULT_DRAW_CAR_OPTIONS,
): void {
  assertDrawableCarDimensions(car);

  context.save();

  context.fillStyle = options.bodyFillColor;
  context.strokeStyle = options.bodyStrokeColor;
  context.lineWidth = options.bodyLineWidth;
  context.shadowColor = options.shadowColor;
  context.shadowBlur = options.shadowBlur;

  context.beginPath();
  context.rect(-car.width / 2, -car.height / 2, car.width, car.height);
  context.fill();
  context.stroke();

  context.restore();
}

/**
 * Draws a forward-facing indicator near the front edge of the car.
 *
 * Front convention:
 * - The car is drawn in local coordinates after the context is translated to
 *   the car center and rotated by car.angle.
 * - Local Y = -height / 2 is the front edge.
 * - Because this is drawn after the car transform is applied, the indicator
 *   naturally rotates with the car body.
 *
 * This function does not mutate car state and does not know about world
 * coordinates.
 */
export function drawCarFrontIndicator(
  context: CanvasRenderingContext2D,
  car: Pick<CarState, "width" | "height">,
  options: Pick<Required<DrawCarOptions>, "frontIndicatorColor">,
): void {
  assertDrawableCarDimensions(car);

  const indicatorWidth = car.width * 0.45;
  const indicatorHeight = Math.max(3, car.height * 0.08);

  const indicatorX = -indicatorWidth / 2;
  const indicatorY = -car.height / 2 + 6;

  context.save();

  context.fillStyle = options.frontIndicatorColor;
  context.shadowBlur = 0;

  context.fillRect(indicatorX, indicatorY, indicatorWidth, indicatorHeight);

  context.restore();
}

/**
 * Validates complete car state required by drawCar().
 */
export function assertDrawableCarState(car: CarState): void {
  assertDrawableCarTransform(car);
  assertDrawableCarDimensions(car);
}

/**
 * Validates car transform fields required by drawCar().
 */
export function assertDrawableCarTransform(
  car: Pick<CarState, "positionX" | "positionY" | "angle">,
): void {
  const valuesToCheck: Array<[string, number]> = [
    ["positionX", car.positionX],
    ["positionY", car.positionY],
    ["angle", car.angle],
  ];

  for (const [label, value] of valuesToCheck) {
    if (!Number.isFinite(value)) {
      throw new RangeError(`car.${label} must be finite for rendering.`);
    }
  }
}

/**
 * Validates car dimensions required by body/front rendering.
 */
export function assertDrawableCarDimensions(
  car: Pick<CarState, "width" | "height">,
): void {
  if (!Number.isFinite(car.width)) {
    throw new RangeError("car.width must be finite for rendering.");
  }

  if (!Number.isFinite(car.height)) {
    throw new RangeError("car.height must be finite for rendering.");
  }

  if (car.width <= 0) {
    throw new RangeError("car.width must be greater than 0 for rendering.");
  }

  if (car.height <= 0) {
    throw new RangeError("car.height must be greater than 0 for rendering.");
  }
}
