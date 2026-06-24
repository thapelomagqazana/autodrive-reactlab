/**
 * Canvas sizing utilities.
 *
 * These helpers keep canvas CSS dimensions separate from the internal drawing
 * buffer dimensions. This prevents blurry rendering on high-DPI screens.
 *
 * Non-responsibilities:
 * - No drawing.
 * - No resize listeners.
 * - No game loop.
 * - No simulation logic.
 */

export interface CanvasCssSize {
  width: number;
  height: number;
}

export interface CanvasBufferSize {
  width: number;
  height: number;
  pixelRatio: number;
}

const DEFAULT_PIXEL_RATIO = 1;
const MAX_PIXEL_RATIO = 3;

/**
 * Normalizes device pixel ratio into a safe rendering scale.
 */
export function normalizePixelRatio(value: number | undefined): number {
  if (!Number.isFinite(value) || value === undefined || value <= 0) {
    return DEFAULT_PIXEL_RATIO;
  }

  return Math.min(value, MAX_PIXEL_RATIO);
}

/**
 * Calculates the backing canvas buffer size from visible CSS dimensions.
 */
export function calculateCanvasBufferSize(
  cssSize: CanvasCssSize,
  devicePixelRatio = DEFAULT_PIXEL_RATIO,
): CanvasBufferSize {
  const safePixelRatio = normalizePixelRatio(devicePixelRatio);

  const safeWidth = Math.max(0, Math.floor(cssSize.width));
  const safeHeight = Math.max(0, Math.floor(cssSize.height));

  return {
    width: Math.floor(safeWidth * safePixelRatio),
    height: Math.floor(safeHeight * safePixelRatio),
    pixelRatio: safePixelRatio,
  };
}

/**
 * Applies CSS dimensions and drawing-buffer dimensions to a canvas.
 */
export function applyCanvasSize(
  canvas: HTMLCanvasElement,
  cssSize: CanvasCssSize,
  devicePixelRatio = DEFAULT_PIXEL_RATIO,
): CanvasBufferSize {
  const bufferSize = calculateCanvasBufferSize(cssSize, devicePixelRatio);

  if (canvas.width !== bufferSize.width) {
    canvas.width = bufferSize.width;
  }

  if (canvas.height !== bufferSize.height) {
    canvas.height = bufferSize.height;
  }

  return bufferSize;
}
