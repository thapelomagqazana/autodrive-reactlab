/**
 * Read-only canvas diagnostic metrics.
 *
 * Purpose:
 * - Help developers verify canvas sizing.
 * - Help debug HiDPI / Retina scaling.
 * - Help confirm logical size vs drawing-buffer size.
 *
 * Non-responsibilities:
 * - No canvas mutation.
 * - No resize logic.
 * - No rendering logic.
 */
export interface CanvasDiagnostics {
  /** Logical CSS width of the canvas viewport, in pixels. */
  width: number;

  /** Logical CSS height of the canvas viewport, in pixels. */
  height: number;

  /** Device pixel ratio used when sizing the drawing buffer. */
  pixelRatio: number;

  /** Physical canvas drawing-buffer width, in pixels. */
  bufferWidth: number;

  /** Physical canvas drawing-buffer height, in pixels. */
  bufferHeight: number;
}