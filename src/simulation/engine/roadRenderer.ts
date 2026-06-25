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
  dividerColor: "rgb(148 163 184)",
  boundaryLineWidth: 3,
  dividerLineWidth: 2,
  dividerDash: [18, 18],
  showCenterGuide: false,
  centerGuideColor: "rgb(56 189 248)",
  centerGuideLineWidth: 1,
};

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
  drawRoadLines(context, getRoadBoundaryLines(road), {
    color: resolvedOptions.boundaryColor,
    lineWidth: resolvedOptions.boundaryLineWidth,
    dash: [],
  });

  drawRoadLines(context, getLaneDividerLines(road), {
    color: resolvedOptions.dividerColor,
    lineWidth: resolvedOptions.dividerLineWidth,
    dash: resolvedOptions.dividerDash,
  });

  if (resolvedOptions.showCenterGuide) {
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
        color: resolvedOptions.centerGuideColor,
        lineWidth: resolvedOptions.centerGuideLineWidth,
        dash: [8, 12],
      },
    );
  }

  context.restore();
}

/**
 * Draws the road surface rectangle from model-derived geometry.
 */
export function drawRoadSurface(
  context: CanvasRenderingContext2D,
  road: Road,
  options: Required<DrawRoadOptions>,
): void {
  const leftEdgeX = getRoadLeftEdgeX(road);
  const height = road.bottomY - road.topY;

  context.fillStyle = options.surfaceColor;
  context.fillRect(leftEdgeX, road.topY, road.width, height);
}

export interface DrawLineStyle {
  color: string;
  lineWidth: number;
  dash: number[];
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

  context.beginPath();
  context.moveTo(line.startX, line.startY);
  context.lineTo(line.endX, line.endY);
  context.stroke();

  context.setLineDash([]);
  context.restore();
}
