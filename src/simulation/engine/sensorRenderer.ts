/**
 * Canvas renderer for the visual sensor overlay in AutoDrive ReactLab.
 *
 * This module visualizes already-generated sensor rays and already-calculated
 * sensor readings.
 *
 * Responsibility:
 * - Draw clear full-range rays when no detection exists.
 * - Draw clear ray segments from ray start to hit point.
 * - Draw danger ray segments from hit point to ray end.
 * - Draw hit markers at detection points.
 * - Respect overlay enabled/disabled state.
 *
 * This module intentionally does not:
 * - Generate sensor rays.
 * - Calculate intersections.
 * - Calculate distances.
 * - Update SensorState.
 * - Read from Zustand.
 * - Make AI decisions.
 * - Call requestAnimationFrame.
 *
 * Camera transforms are expected to be applied by the caller before drawSensors()
 * is called.
 */

import type { SensorRay, SensorReading } from "../sensors/sensorModel";

/**
 * Visual styling options for the sensor overlay.
 */
export interface SensorOverlayStyle {
  /** Color used for clear, unobstructed ray segments. */
  readonly clearColor: string;

  /** Color used for blocked/danger segments after a detection point. */
  readonly dangerColor: string;

  /** Color used for hit point markers. */
  readonly hitColor: string;

  /** Stroke width for sensor ray lines. */
  readonly lineWidth: number;

  /** Radius of the circular hit marker. */
  readonly hitMarkerRadius: number;
}

/**
 * Options required to draw the sensor overlay.
 */
export interface DrawSensorsOptions {
  /** Whether the overlay should be drawn. If false, no drawing occurs. */
  readonly isEnabled: boolean;

  /** Generated sensor rays to visualize. */
  readonly rays: readonly SensorRay[];

  /** Latest sensor readings mapped to rays by rayIndex. */
  readonly readings: readonly SensorReading[];

  /** Optional style overrides for this draw call. */
  readonly style?: Partial<SensorOverlayStyle>;
}

/**
 * Centralized default visual style for the sensor overlay.
 */
export const DEFAULT_SENSOR_OVERLAY_STYLE: SensorOverlayStyle = Object.freeze({
  clearColor: "rgba(34, 197, 94, 0.85)",
  dangerColor: "rgba(239, 68, 68, 0.85)",
  hitColor: "rgba(250, 204, 21, 0.95)",
  lineWidth: 2,
  hitMarkerRadius: 4,
});

/**
 * Ensures a canvas rendering context was supplied.
 */
function assertValidContext(context: CanvasRenderingContext2D): void {
  if (context === null || context === undefined) {
    throw new TypeError("Canvas rendering context is required.");
  }
}

/**
 * Ensures a point contains finite world-space coordinates.
 */
function assertFinitePoint(
  point: { readonly x: number; readonly y: number },
  label: string,
): void {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    throw new RangeError(`${label} must contain finite world-space coordinates.`);
  }
}

/**
 * Builds a lookup table from ray index to sensor reading.
 *
 * Mapping by rayIndex is more stable than relying on array order.
 */
function createReadingMap(
  readings: readonly SensorReading[],
): ReadonlyMap<number, SensorReading> {
  const map = new Map<number, SensorReading>();

  for (const reading of readings) {
    if (!Number.isInteger(reading.rayIndex) || reading.rayIndex < 0) {
      throw new RangeError("reading.rayIndex must be a non-negative integer.");
    }

    map.set(reading.rayIndex, reading);
  }

  return map;
}

/**
 * Draws a single line segment on the canvas.
 */
function drawLine(
  context: CanvasRenderingContext2D,
  start: { readonly x: number; readonly y: number },
  end: { readonly x: number; readonly y: number },
  color: string,
  lineWidth: number,
): void {
  assertFinitePoint(start, "line.start");
  assertFinitePoint(end, "line.end");

  context.strokeStyle = color;
  context.lineWidth = lineWidth;
  context.beginPath();
  context.moveTo(start.x, start.y);
  context.lineTo(end.x, end.y);
  context.stroke();
}

/**
 * Draws a circular hit marker at a detection point.
 */
function drawHitMarker(
  context: CanvasRenderingContext2D,
  point: { readonly x: number; readonly y: number },
  color: string,
  radius: number,
): void {
  assertFinitePoint(point, "hit point");

  context.fillStyle = color;
  context.beginPath();
  context.arc(point.x, point.y, radius, 0, Math.PI * 2);
  context.fill();
}

/**
 * Draws the sensor overlay for existing rays and readings.
 *
 * Rendering rules:
 * - Disabled overlay: draw nothing.
 * - Missing reading: draw full clear ray.
 * - No-detection reading: draw full clear ray.
 * - Detected reading: draw clear segment from ray.start to reading.point.
 * - Detected reading: draw danger segment from reading.point to ray.end.
 * - Detected reading: draw hit marker at reading.point.
 */
export function drawSensors(
  context: CanvasRenderingContext2D,
  options: DrawSensorsOptions,
): void {
  assertValidContext(context);

  if (!options.isEnabled) {
    return;
  }

  const style: SensorOverlayStyle = {
    ...DEFAULT_SENSOR_OVERLAY_STYLE,
    ...options.style,
  };

  const readingsByRayIndex = createReadingMap(options.readings);

  context.save();

  for (const ray of options.rays) {
    assertFinitePoint(ray.start, "ray.start");
    assertFinitePoint(ray.end, "ray.end");

    if (!Number.isInteger(ray.index) || ray.index < 0) {
      throw new RangeError("ray.index must be a non-negative integer.");
    }

    const reading = readingsByRayIndex.get(ray.index);

    if (reading === undefined || !reading.detected) {
      drawLine(context, ray.start, ray.end, style.clearColor, style.lineWidth);
      continue;
    }

    assertFinitePoint(reading.point, "reading.point");

    drawLine(context, ray.start, reading.point, style.clearColor, style.lineWidth);
    drawLine(context, reading.point, ray.end, style.dangerColor, style.lineWidth);
    drawHitMarker(context, reading.point, style.hitColor, style.hitMarkerRadius);
  }

  context.restore();
}
