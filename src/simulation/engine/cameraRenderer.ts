import type { CameraState } from "../camera";

/**
 * Applies the active camera transform to world-space rendering.
 *
 * Convention:
 * - screenX = worldX + offsetX
 * - screenY = worldY + offsetY
 */
export function applyCameraTransform(
  context: CanvasRenderingContext2D,
  camera: CameraState,
): void {
  context.translate(camera.offsetX, camera.offsetY);
}
