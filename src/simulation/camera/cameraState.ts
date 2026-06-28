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

export interface CameraViewport {
  width: number;
  height: number;
}

export interface CameraAnchor {
  anchorX: number;
  anchorY: number;
}

export const DEFAULT_FOLLOW_CAMERA_ANCHOR_Y_RATIO = 0.72;

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

export function assertValidCameraViewport(viewport: CameraViewport): void {
  if (!Number.isFinite(viewport.width) || viewport.width <= 0) {
    throw new RangeError("viewport.width must be a finite positive number.");
  }

  if (!Number.isFinite(viewport.height) || viewport.height <= 0) {
    throw new RangeError("viewport.height must be a finite positive number.");
  }
}

export function assertValidAnchorRatio(anchorYRatio: number): void {
  if (!Number.isFinite(anchorYRatio) || anchorYRatio < 0 || anchorYRatio > 1) {
    throw new RangeError("anchorYRatio must be a finite number between 0 and 1.");
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

/**
 * Calculates the desired screen anchor for follow mode.
 *
 * X:
 * - center of the viewport
 *
 * Y:
 * - 72% down the viewport by default
 * - keeps the car lower on screen so more road ahead is visible
 */
export function calculateFollowCameraAnchor(
  viewport: CameraViewport,
  anchorYRatio = DEFAULT_FOLLOW_CAMERA_ANCHOR_Y_RATIO,
): CameraAnchor {
  assertValidCameraViewport(viewport);
  assertValidAnchorRatio(anchorYRatio);

  return {
    anchorX: viewport.width / 2,
    anchorY: viewport.height * anchorYRatio,
  };
}

/**
 * Calculates the offset required to render the car at the follow anchor.
 *
 * Given:
 * screen = world + offset
 *
 * Therefore:
 * offset = anchor - carWorldPosition
 */
export function calculateFollowCameraOffset(
  car: WorldPosition,
  viewport: CameraViewport,
  anchorYRatio = DEFAULT_FOLLOW_CAMERA_ANCHOR_Y_RATIO,
): Pick<CameraState, "offsetX" | "offsetY"> {
  assertFiniteCameraNumber(car.positionX, "car.positionX");
  assertFiniteCameraNumber(car.positionY, "car.positionY");

  const anchor = calculateFollowCameraAnchor(viewport, anchorYRatio);

  return {
    offsetX: anchor.anchorX - car.positionX,
    offsetY: anchor.anchorY - car.positionY,
  };
}

/**
 * Resolves the camera used for the current render pass.
 *
 * Fixed mode:
 * - returns the original camera unchanged
 *
 * Follow mode:
 * - returns a fresh camera with offsets calculated from car + viewport
 */
export function resolveCameraForView(
  camera: CameraState,
  car: WorldPosition,
  viewport: CameraViewport,
): CameraState {
  assertValidCameraState(camera);

  if (camera.mode === "fixed") {
    return camera;
  }

  return {
    ...camera,
    ...calculateFollowCameraOffset(car, viewport),
  };
}
