/**
 * Camera view state for AutoDrive ReactLab.
 *
 * Responsibility:
 * - Describe how world-space simulation coordinates are projected onto the
 *   canvas screen.
 *
 * Non-responsibilities:
 * - Does not mutate car state.
 * - Does not mutate road state.
 * - Does not run physics.
 * - Does not read keyboard input.
 * - Does not access React or Zustand.
 */

export type CameraMode = "fixed" | "follow";

export interface CameraState {
  /**
   * Horizontal camera offset in world pixels.
   *
   * Screen-space X is calculated as:
   * screenX = worldX - offsetX
   */
  offsetX: number;

  /**
   * Vertical camera offset in world pixels.
   *
   * Screen-space Y is calculated as:
   * screenY = worldY - offsetY
   */
  offsetY: number;

  /**
   * Camera behaviour mode.
   *
   * fixed:
   * - offset remains 0,0 unless explicitly configured.
   *
   * follow:
   * - future phases may update offset from the car position.
   */
  mode: CameraMode;
}

export interface WorldPosition {
  positionX: number;
  positionY: number;
}

export interface ScreenPosition {
  screenX: number;
  screenY: number;
}

export const DEFAULT_CAMERA_STATE: Readonly<CameraState> = Object.freeze({
  offsetX: 0,
  offsetY: 0,
  mode: "fixed",
});

export function isValidCameraMode(value: string): value is CameraMode {
  return value === "fixed" || value === "follow";
}

export function assertFiniteCameraNumber(value: number, label: string): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${label} must be a finite number.`);
  }
}

export function assertValidCameraState(camera: CameraState): void {
  assertFiniteCameraNumber(camera.offsetX, "camera.offsetX");
  assertFiniteCameraNumber(camera.offsetY, "camera.offsetY");

  if (!isValidCameraMode(camera.mode)) {
    throw new RangeError('camera.mode must be either "fixed" or "follow".');
  }
}

/**
 * Creates a fresh default camera state.
 *
 * A new object is returned every time so Zustand reset logic and tests do not
 * accidentally share mutable camera references.
 */
export function createInitialCameraState(
  overrides: Partial<CameraState> = {},
): CameraState {
  const camera: CameraState = {
    ...DEFAULT_CAMERA_STATE,
    ...overrides,
  };

  assertValidCameraState(camera);

  return camera;
}

/**
 * Converts a world-space position into screen-space coordinates.
 *
 * This function is pure. It does not mutate the input world position or camera.
 */
export function worldToScreenPosition(
  position: WorldPosition,
  camera: CameraState,
): ScreenPosition {
  assertFiniteCameraNumber(position.positionX, "position.positionX");
  assertFiniteCameraNumber(position.positionY, "position.positionY");
  assertValidCameraState(camera);

  return {
    screenX: position.positionX - camera.offsetX,
    screenY: position.positionY - camera.offsetY,
  };
}

/**
 * Converts screen-space coordinates back into world-space coordinates.
 *
 * Useful for future mouse picking, debug tools, editor mode, and sensors.
 */
export function screenToWorldPosition(
  position: ScreenPosition,
  camera: CameraState,
): WorldPosition {
  assertFiniteCameraNumber(position.screenX, "position.screenX");
  assertFiniteCameraNumber(position.screenY, "position.screenY");
  assertValidCameraState(camera);

  return {
    positionX: position.screenX + camera.offsetX,
    positionY: position.screenY + camera.offsetY,
  };
}
