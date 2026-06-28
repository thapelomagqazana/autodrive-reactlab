# Camera View State

## Purpose

The camera view state defines how world-space simulation coordinates are projected onto the visible canvas.

The camera exists to move the viewer, not the simulation world.

Core rule:

```txt
Camera movement affects rendering only.
Physics state remains unchanged.
```

---

# Scope

This document covers **Phase 1.12.1 — Define Camera View State**.

This phase introduces:

```txt
CameraState
createInitialCameraState()
worldToScreenPosition()
screenToWorldPosition()
applyCameraTransform()
```

It does **not** implement:

```txt
Follow-camera smoothing
Zoom
Rotation
Camera shake
Minimap rendering
World chunking
Road generation
Physics changes
```

---

# Why Camera State Exists

Without a camera model, the canvas can only show a fixed part of the world.

As the car moves, it may eventually leave the visible viewport.

A camera model allows future rendering to follow the car while keeping:

```txt
CarState.positionX
CarState.positionY
Road coordinates
Obstacle coordinates
Physics calculations
```

in world space.

---

# CameraState Model

Recommended type:

```ts
export type CameraMode = "fixed" | "follow";

export interface CameraState {
  /**
   * Horizontal camera offset in world pixels.
   */
  offsetX: number;

  /**
   * Vertical camera offset in world pixels.
   */
  offsetY: number;

  /**
   * Camera behaviour mode.
   */
  mode: CameraMode;
}
```

---

# Camera Modes

## Fixed

```txt
mode = "fixed"
```

The camera does not move automatically.

MVP default:

```ts
{
  offsetX: 0,
  offsetY: 0,
  mode: "fixed",
}
```

This keeps existing rendering behaviour unchanged.

---

## Follow

```txt
mode = "follow"
```

Reserved for future phases.

The camera may follow the car by updating offsets based on:

```txt
CarState.positionX
CarState.positionY
Canvas width
Canvas height
```

---

# Default Camera State

Recommended:

```ts
export const DEFAULT_CAMERA_STATE: Readonly<CameraState> = Object.freeze({
  offsetX: 0,
  offsetY: 0,
  mode: "fixed",
});
```

Factory:

```ts
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
```

A fresh object should be returned every time.

---

# Coordinate Spaces

## World Space

World space is the simulation's real coordinate system.

Examples:

```txt
car.positionX
car.positionY
road.centerX
obstacle.positionX
```

Physics uses world space.

Rendering begins from world space.

---

## Screen Space

Screen space is where something appears on the visible canvas after the camera offset is applied.

Example:

```txt
screenX = worldX - camera.offsetX
screenY = worldY - camera.offsetY
```

---

# World-to-Screen Conversion

Recommended helper:

```ts
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
```

Example:

```txt
World position:
X = 450
Y = 720

Camera:
offsetX = 50
offsetY = 120

Screen position:
X = 400
Y = 600
```

---

# Screen-to-World Conversion

Recommended helper:

```ts
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
```

This prepares the project for:

```txt
Mouse picking
Debug tools
Scenario editors
Waypoint placement
Obstacle placement
```

---

# Canvas Transform

Recommended helper:

```ts
export function applyCameraTransform(
  context: CanvasRenderingContext2D,
  camera: CameraState,
): void {
  context.translate(-camera.offsetX, -camera.offsetY);
}
```

Usage:

```ts
context.save();

applyCameraTransform(context, camera);

drawRoad(context, road);
drawCar(context, car);

context.restore();
```

The save/restore pair is important because camera transforms must not leak into overlays, HUDs, or later diagnostics.

---

# Store Integration

Recommended state field:

```ts
camera: CameraState;
```

Initial state:

```ts
camera: createInitialCameraState();
```

Reset state:

```ts
camera: createInitialCameraState();
```

Selector:

```ts
export const useSimulationCamera = () => useSimulationStore((state) => state.camera);
```

---

# Renderer Integration

Recommended frame options:

```ts
export interface DrawSimulationFrameOptions {
  road?: DrawRoadOptions;
  car?: DrawCarOptions;
  camera?: CameraState;
}
```

Recommended frame render order:

```ts
drawRoad(context, road, options.road);

context.save();

if (options.camera) {
  applyCameraTransform(context, options.camera);
}

drawCar(context, car, options.car);

context.restore();
```

If the camera should affect both road and car, apply the transform before both:

```ts
context.save();

if (options.camera) {
  applyCameraTransform(context, options.camera);
}

drawRoad(context, road, options.road);
drawCar(context, car, options.car);

context.restore();
```

For MVP, prefer applying the camera to the full world frame so road and car remain visually aligned.

---

# SimulationCanvas Integration

Recommended:

```tsx
const camera = useSimulationCamera();

drawSimulationFrame(context, road, car, {
  camera,
  road: {
    showCenterGuide: ui.isDebugModeEnabled,
  },
});
```

---

# Validation Rules

Camera state is valid when:

```txt
offsetX is finite
offsetY is finite
mode is "fixed" or "follow"
```

Invalid examples:

```txt
offsetX = NaN
offsetY = Infinity
mode = "tracking"
```

Invalid values should throw:

```txt
RangeError
```

---

# Testing Strategy

## Unit Tests

Verify:

```txt
Default camera is fixed at 0,0.
Overrides are supported.
Invalid offsets throw RangeError.
Invalid mode throws RangeError.
worldToScreenPosition subtracts camera offset.
screenToWorldPosition adds camera offset.
Conversion helpers do not mutate input objects.
```

---

## Store Tests

Verify:

```txt
Store initializes camera from createInitialCameraState().
Reset recreates camera state.
Camera state is not the same object reference after reset.
```

---

## Renderer Tests

Verify:

```txt
Renderer calls context.save().
Renderer applies camera transform.
Renderer draws road and car under the same transform.
Renderer calls context.restore().
Camera transform does not leak.
```

---

# Acceptance Criteria

This task is complete when:

```txt
Camera state is strongly typed.
Camera offset does not mutate car or road state.
Renderer can apply camera transform.
Fixed mode keeps offset at 0,0.
Tests verify world-to-screen conversion.
```

---

# Traceability KPI

```txt
Camera movement affects rendering only, not simulation physics.
```

Success means:

```txt
Changing camera.offsetX or camera.offsetY changes what the user sees, but does not change CarState, Road, physics, or telemetry world coordinates.
```

---

# Engineering Lessons Learned

## Camera Is Not Physics

Moving the camera is not the same as moving the car.

The car's world position stays true even if the screen view shifts.

---

## World Space Must Stay Stable

Physics, sensors, AI, and collision systems should reason in world space.

Only rendering should apply camera offset.

---

## Save and Restore Canvas State

Canvas transforms are global to the context.

Always use:

```ts
context.save();
context.restore();
```

around camera rendering.

---

# Future Evolution

This camera foundation prepares the simulator for:

```txt
Follow camera
Smooth camera interpolation
Zoom
Camera bounds
Debug overlays
Mini-map
World-to-screen mouse picking
Scenario editors
Replay camera controls
Multiple camera modes
```

The stable rule remains:

```txt
Camera transforms presentation, not simulation truth.
```
