import type { CameraState } from "../camera";

/**
 * Applies the camera transform to the canvas context.
 *
 * Callers must wrap this in context.save() / context.restore().
 *
 * Rule:
 * - World objects keep world coordinates.
 * - Camera shifts rendering only.
 */
export function applyCameraTransform(
  context: CanvasRenderingContext2D,
  camera: CameraState,
): void {
  context.translate(-camera.offsetX, -camera.offsetY);
}
