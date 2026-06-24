/**
 * Formats canvas dimensions into a readable resolution string.
 *
 * Example:
 * 1280 × 720
 */
export function formatCanvasResolution(width: number, height: number): string {
  const safeWidth = Number.isFinite(width) && width >= 0 ? Math.round(width) : 0;
  const safeHeight = Number.isFinite(height) && height >= 0 ? Math.round(height) : 0;

  return `${safeWidth} × ${safeHeight}`;
}