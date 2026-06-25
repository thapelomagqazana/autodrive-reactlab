/**
 * Road renderer for AutoDrive ReactLab.
 *
 * Responsibility:
 * - Draw road visuals onto an existing CanvasRenderingContext2D.
 *
 * Non-responsibilities:
 * - Does not create road state.
 * - Does not mutate road state.
 * - Does not resize canvas.
 * - Does not start a game loop.
 * - Does not import React or Zustand.
 */

import {
  getLaneDividerLines,
  getRoadBoundaryLines,
  getRoadLeftEdgeX,
  type Road,
  type RoadLine,
} from "../world";

/**
 * Styling options for road rendering.
 *
 * These options allow the renderer to follow the Tesla FSD + Mission Control
 * theme while remaining configurable for tests, debug views, and future themes.
 */
export interface DrawRoadOptions {
  /** Road surface fill color. */
  surfaceColor?: string;

  /** Road boundary line color. */
  boundaryColor?: string;

  /** Optional boundary glow color. */
  boundaryGlowColor?: string;

  /** Whether boundary glow should be rendered. */
  showBoundaryGlow?: boolean;

  /** Lane divider line color. */
  dividerColor?: string;

  /** Road boundary line width in pixels. */
  boundaryLineWidth?: number;

  /** Lane divider line width in pixels. */
  dividerLineWidth?: number;

  /** Optional dashed divider pattern. */
  dividerDash?: number[];

  /** Optional debug center guide. */
  showCenterGuide?: boolean;

  /** Debug center guide color. */
  centerGuideColor?: string;

  /** Debug center guide line width. */
  centerGuideLineWidth?: number;
}

/**
 * Mission-control inspired default road styling.
 */
export const DEFAULT_DRAW_ROAD_OPTIONS: Required<DrawRoadOptions> = {
  surfaceColor: "rgb(15 23 42)",
  boundaryColor: "rgb(226 232 240)",
  boundaryGlowColor: "rgb(96 165 250 / 0.35)",
  showBoundaryGlow: false,
  dividerColor: "rgb(148 163 184)",
  boundaryLineWidth: 3,
  dividerLineWidth: 2,
  dividerDash: [18, 18],
  showCenterGuide: false,
  centerGuideColor: "rgb(56 189 248)",
  centerGuideLineWidth: 1,
};

export interface RoadSurfaceRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Calculates the road surface rectangle from Road domain geometry.
 *
 * This helper is pure and testable. It exists to prevent renderers from
 * duplicating road-bound calculations.
 */
export function getRoadSurfaceRect(road: Road): RoadSurfaceRect {
  const leftEdgeX = getRoadLeftEdgeX(road);
  const height = road.bottomY - road.topY;

  return {
    x: leftEdgeX,
    y: road.topY,
    width: road.width,
    height,
  };
}

/**
 * Draws only the left and right road boundary lines.
 *
 * This function exists so frame renderers and tests can verify road edge
 * rendering independently from the complete drawRoad() pipeline.
 */
export function drawRoadBoundaries(
  context: CanvasRenderingContext2D,
  road: Road,
  options: Pick<
    Required<DrawRoadOptions>,
    "boundaryColor" | "boundaryLineWidth" | "boundaryGlowColor" | "showBoundaryGlow"
  > = DEFAULT_DRAW_ROAD_OPTIONS,
): void {
  const boundaryLines = getRoadBoundaryLines(road);

  drawRoadLines(context, boundaryLines, {
    color: options.boundaryColor,
    lineWidth: options.boundaryLineWidth,
    dash: [],
    shadowColor: options.showBoundaryGlow ? options.boundaryGlowColor : undefined,
    shadowBlur: options.showBoundaryGlow ? 8 : 0,
  });
}

/**
 * Draws the optional road center guide line.
 *
 * This is a debug-only visual used to verify road alignment, car spawn
 * alignment, camera alignment, and lane geometry.
 *
 * It is hidden by default and only renders when explicitly enabled through
 * `showCenterGuide`.
 */
export function drawRoadCenterGuide(
  context: CanvasRenderingContext2D,
  road: Road,
  options: Pick<
    Required<DrawRoadOptions>,
    "showCenterGuide" | "centerGuideColor" | "centerGuideLineWidth"
  > = DEFAULT_DRAW_ROAD_OPTIONS,
): void {
  if (!options.showCenterGuide) {
    return;
  }

  drawRoadLine(
    context,
    {
      startX: road.centerX,
      startY: road.topY,
      endX: road.centerX,
      endY: road.bottomY,
      kind: "divider",
    },
    {
      color: options.centerGuideColor,
      lineWidth: options.centerGuideLineWidth,
      dash: [8, 12],
    },
  );
}

/**
 * Draws only lane divider markings.
 *
 * Lane dividers are visual road markings, not collision boundaries.
 * They must be generated from Road lane data, not hardcoded renderer values.
 */
export function drawLaneDividers(
  context: CanvasRenderingContext2D,
  road: Road,
  options: Pick<
    Required<DrawRoadOptions>,
    "dividerColor" | "dividerLineWidth" | "dividerDash"
  > = DEFAULT_DRAW_ROAD_OPTIONS,
): void {
  const dividerLines = getLaneDividerLines(road);

  drawRoadLines(context, dividerLines, {
    color: options.dividerColor,
    lineWidth: options.dividerLineWidth,
    dash: options.dividerDash,
  });
}

/**
 * Draws the full MVP road.
 */
export function drawRoad(
  context: CanvasRenderingContext2D,
  road: Road,
  options: DrawRoadOptions = {},
): void {
  const resolvedOptions = {
    ...DEFAULT_DRAW_ROAD_OPTIONS,
    ...options,
  };

  context.save();

  drawRoadSurface(context, road, resolvedOptions);
  drawRoadBoundaries(context, road, resolvedOptions);
  drawLaneDividers(context, road, resolvedOptions);
  drawRoadCenterGuide(context, road, resolvedOptions);

  context.restore();
}

/**
 * Draws only the filled road background surface.
 *
 * This function does not draw lane dividers, boundaries, vehicles, sensors,
 * HUD elements, or debug overlays.
 */
export function drawRoadSurface(
  context: CanvasRenderingContext2D,
  road: Road,
  options: Pick<Required<DrawRoadOptions>, "surfaceColor"> = DEFAULT_DRAW_ROAD_OPTIONS,
): void {
  const surface = getRoadSurfaceRect(road);

  context.save();
  context.fillStyle = options.surfaceColor;
  context.fillRect(surface.x, surface.y, surface.width, surface.height);
  context.restore();
}

export interface DrawLineStyle {
  color: string;
  lineWidth: number;
  dash: number[];
  shadowColor?: string;
  shadowBlur?: number;
}

/**
 * Draws multiple road lines using the same style.
 */
export function drawRoadLines(
  context: CanvasRenderingContext2D,
  lines: RoadLine[],
  style: DrawLineStyle,
): void {
  for (const line of lines) {
    drawRoadLine(context, line, style);
  }
}

/**
 * Draws one road line.
 */
export function drawRoadLine(
  context: CanvasRenderingContext2D,
  line: RoadLine,
  style: DrawLineStyle,
): void {
  context.save();

  context.strokeStyle = style.color;
  context.lineWidth = style.lineWidth;
  context.setLineDash(style.dash);

  if (style.shadowColor && style.shadowBlur && style.shadowBlur > 0) {
    context.shadowColor = style.shadowColor;
    context.shadowBlur = style.shadowBlur;
  }

  context.beginPath();
  context.moveTo(line.startX, line.startY);
  context.lineTo(line.endX, line.endY);
  context.stroke();

  context.setLineDash([]);
  context.restore();
}
