/**
 * Grid renderer for AutoDrive ReactLab.
 *
 * Responsibility:
 * - Render a lightweight development grid onto a 2D canvas context.
 * - Provide coordinate reference for future renderer work.
 *
 * Non-responsibility:
 * - No physics.
 * - No AI.
 * - No sensors.
 * - No game loop.
 * - No React dependency.
 */

export interface GridRenderOptions {
  width: number;
  height: number;
  spacing?: number;
  lineColor?: string;
  originColor?: string;
  enabled?: boolean;
}

export interface GridLine {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

const DEFAULT_GRID_SPACING = 40;
const DEFAULT_GRID_LINE_COLOR = "rgba(0, 234, 255, 0.18)";
const DEFAULT_ORIGIN_COLOR = "rgba(255, 230, 0, 0.85)";

function normalizeDimension(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return Math.floor(value);
}

function normalizeSpacing(value: number | undefined): number {
  if (!Number.isFinite(value) || value === undefined || value <= 0) {
    return DEFAULT_GRID_SPACING;
  }

  return Math.max(4, Math.floor(value));
}

/**
 * Calculates vertical and horizontal grid lines.
 *
 * This pure function is easy to test and keeps draw logic deterministic.
 */
export function calculateGridLines(options: GridRenderOptions): GridLine[] {
  if (options.enabled === false) {
    return [];
  }

  const width = normalizeDimension(options.width);
  const height = normalizeDimension(options.height);
  const spacing = normalizeSpacing(options.spacing);

  if (width === 0 || height === 0) {
    return [];
  }

  const lines: GridLine[] = [];

  for (let x = 0; x <= width; x += spacing) {
    lines.push({
      fromX: x,
      fromY: 0,
      toX: x,
      toY: height,
    });
  }

  for (let y = 0; y <= height; y += spacing) {
    lines.push({
      fromX: 0,
      fromY: y,
      toX: width,
      toY: y,
    });
  }

  return lines;
}

/**
 * Draws a lightweight coordinate grid onto the provided canvas context.
 *
 * The caller owns frame clearing and render-loop scheduling.
 */
export function renderBackgroundGrid(
  context: CanvasRenderingContext2D,
  options: GridRenderOptions,
): void {
  const lines = calculateGridLines(options);

  if (lines.length === 0) {
    return;
  }

  context.save();

  context.strokeStyle = options.lineColor ?? DEFAULT_GRID_LINE_COLOR;
  context.lineWidth = 1;

  context.beginPath();

  for (const line of lines) {
    context.moveTo(line.fromX, line.fromY);
    context.lineTo(line.toX, line.toY);
  }

  context.stroke();

  context.fillStyle = options.originColor ?? DEFAULT_ORIGIN_COLOR;
  context.beginPath();
  context.arc(0, 0, 5, 0, Math.PI * 2);
  context.fill();

  context.restore();
}
