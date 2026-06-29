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

type RoadBoundaryRenderOptions = Pick<
  Required<DrawRoadOptions>,
  | "boundaryColor"
  | "boundaryLineWidth"
  | "boundaryGlowColor"
  | "showBoundaryGlow"
  | "visibleTopY"
  | "visibleBottomY"
>;

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

  /**
   * Visible world-space top Y for camera-aware road rendering.
   */
  visibleTopY?: number;

  /**
   * Visible world-space bottom Y for camera-aware road rendering.
   */
  visibleBottomY?: number;
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
  visibleTopY: Number.NaN,
  visibleBottomY: Number.NaN,
};

const ROAD_RENDER_PADDING_Y = 800;
const LANE_MARKING_LENGTH = 80;
const LANE_MARKING_GAP = 80;
const LANE_MARKING_PERIOD = LANE_MARKING_LENGTH + LANE_MARKING_GAP;

function getProceduralMarkingStartY(visibleTopY: number): number {
  return Math.floor(visibleTopY / LANE_MARKING_PERIOD) * LANE_MARKING_PERIOD;
}

function resolveRoadRenderVerticalBounds(
  road: Road,
  options: Pick<DrawRoadOptions, "visibleTopY" | "visibleBottomY">,
): { topY: number; bottomY: number } {
  const visibleTopY = options.visibleTopY;
  const visibleBottomY = options.visibleBottomY;

  const topY =
    typeof visibleTopY === "number" && Number.isFinite(visibleTopY)
      ? visibleTopY - ROAD_RENDER_PADDING_Y
      : road.topY;

  const bottomY =
    typeof visibleBottomY === "number" && Number.isFinite(visibleBottomY)
      ? visibleBottomY + ROAD_RENDER_PADDING_Y
      : road.bottomY;

  if (bottomY <= topY) {
    return {
      topY: road.topY,
      bottomY: road.bottomY,
    };
  }

  return { topY, bottomY };
}

function stretchRoadLineToBounds(
  line: RoadLine,
  topY: number,
  bottomY: number,
): RoadLine {
  return {
    ...line,
    startY: topY,
    endY: bottomY,
  };
}

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
  options: RoadBoundaryRenderOptions = DEFAULT_DRAW_ROAD_OPTIONS,
): void {
  const bounds = resolveRoadRenderVerticalBounds(road, options);

  const boundaryLines = getRoadBoundaryLines(road).map((line) =>
    stretchRoadLineToBounds(line, bounds.topY, bounds.bottomY),
  );

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
    | "showCenterGuide"
    | "centerGuideColor"
    | "centerGuideLineWidth"
    | "visibleTopY"
    | "visibleBottomY"
  > = DEFAULT_DRAW_ROAD_OPTIONS,
): void {
  if (!options.showCenterGuide) {
    return;
  }

  const bounds = resolveRoadRenderVerticalBounds(road, options);

  drawRoadLine(
    context,
    {
      startX: road.centerX,
      startY: bounds.topY,
      endX: road.centerX,
      endY: bounds.bottomY,
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
    "dividerColor" | "dividerLineWidth" | "dividerDash" | "visibleTopY" | "visibleBottomY"
  > = DEFAULT_DRAW_ROAD_OPTIONS,
): void {
  const bounds = resolveRoadRenderVerticalBounds(road, options);
  const dividerLines = getLaneDividerLines(road);

  context.save();

  context.strokeStyle = options.dividerColor;
  context.lineWidth = options.dividerLineWidth;
  context.setLineDash([]);

  const firstY = getProceduralMarkingStartY(bounds.topY);

  for (const divider of dividerLines) {
    for (
      let markerY = firstY;
      markerY <= bounds.bottomY;
      markerY += LANE_MARKING_PERIOD
    ) {
      context.beginPath();
      context.moveTo(divider.startX, markerY);
      context.lineTo(
        divider.endX,
        Math.min(markerY + LANE_MARKING_LENGTH, bounds.bottomY),
      );
      context.stroke();
    }
  }

  context.restore();
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
  options: Pick<
    Required<DrawRoadOptions>,
    "surfaceColor" | "visibleTopY" | "visibleBottomY"
  > = DEFAULT_DRAW_ROAD_OPTIONS,
): void {
  const surface = getRoadSurfaceRect(road);
  const bounds = resolveRoadRenderVerticalBounds(road, options);

  context.save();
  context.fillStyle = options.surfaceColor;
  context.fillRect(surface.x, bounds.topY, surface.width, bounds.bottomY - bounds.topY);
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
