# Smooth Camera Movement

## Purpose

Smooth camera movement prevents visual jitter, abrupt jumps, and harsh camera snapping while the vehicle moves through world space.

The camera should gradually approach its target offset instead of instantly jumping to it.

Core rule:

```txt
Camera smoothing affects rendering only.
It must not alter car, road, physics, or world coordinates.
```

---

# Scope

This document covers **Phase 1.12.4 — Smooth Camera Movement**.

This phase introduces deterministic camera offset smoothing using linear interpolation.

It does **not** implement:

```txt
Camera zoom
Camera rotation
Camera shake
Spring physics camera
Predictive look-ahead
Cinematic camera modes
World coordinate mutation
Car position smoothing
```

---

# Source of Truth

The camera follows world-space state, but does not change it.

Inputs:

```txt
Current camera offset
Target camera offset
Smoothing factor
```

Output:

```txt
Next camera offset
```

The result should be persisted back to camera state so smoothing accumulates over frames.

---

# Recommended Smoothing

MVP smoothing factor:

```ts
export const DEFAULT_CAMERA_SMOOTHING_FACTOR = 0.12;
```

Meaning:

```txt
Each frame, move 12% of the remaining distance toward the target.
```

Example:

```txt
Current offset: 0
Target offset: 100
Smoothing: 0.12

Next offset:
0 + (100 - 0) * 0.12 = 12
```

Next frame:

```txt
Current offset: 12
Target offset: 100

Next offset:
12 + (100 - 12) * 0.12 = 22.56
```

The camera approaches the target smoothly.

---

# Formula

```ts
next = current + (target - current) * smoothingFactor;
```

Rules:

```txt
smoothingFactor = 0 → no movement
smoothingFactor = 1 → snap to target
0.12 → smooth MVP movement
```

---

# Linear Interpolation Helper

Recommended implementation:

```ts
export function lerpNumber(
  current: number,
  target: number,
  smoothingFactor: number,
): number {
  assertFiniteCameraNumber(current, "current");
  assertFiniteCameraNumber(target, "target");
  assertValidCameraSmoothingFactor(smoothingFactor);

  return current + (target - current) * smoothingFactor;
}
```

---

# Smoothing Factor Validation

Recommended validation:

```ts
export function assertValidCameraSmoothingFactor(value: number): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new RangeError("camera smoothing factor must be between 0 and 1.");
  }
}
```

Valid values:

```txt
0
0.12
0.5
1
```

Invalid values:

```txt
NaN
Infinity
-0.1
1.1
```

---

# Smooth Camera Offset Helper

Recommended implementation:

```ts
export function smoothCameraOffset(
  current: Pick<CameraState, "offsetX" | "offsetY">,
  target: Pick<CameraState, "offsetX" | "offsetY">,
  smoothingFactor = DEFAULT_CAMERA_SMOOTHING_FACTOR,
): Pick<CameraState, "offsetX" | "offsetY"> {
  assertFiniteCameraNumber(current.offsetX, "current.offsetX");
  assertFiniteCameraNumber(current.offsetY, "current.offsetY");
  assertFiniteCameraNumber(target.offsetX, "target.offsetX");
  assertFiniteCameraNumber(target.offsetY, "target.offsetY");
  assertValidCameraSmoothingFactor(smoothingFactor);

  return {
    offsetX: lerpNumber(current.offsetX, target.offsetX, smoothingFactor),
    offsetY: lerpNumber(current.offsetY, target.offsetY, smoothingFactor),
  };
}
```

---

# Follow Camera Resolution

Recommended `resolveCameraForView()` behaviour:

```ts
export function resolveCameraForView(
  camera: CameraState,
  car: WorldPosition,
  viewport: CameraViewport,
  smoothingFactor = DEFAULT_CAMERA_SMOOTHING_FACTOR,
): CameraState {
  assertValidCameraState(camera);
  assertValidCameraSmoothingFactor(smoothingFactor);

  if (camera.mode === "fixed") {
    return camera;
  }

  const targetOffset = calculateFollowCameraOffset(car, viewport);
  const smoothedOffset = smoothCameraOffset(camera, targetOffset, smoothingFactor);

  return {
    ...camera,
    ...smoothedOffset,
  };
}
```

Behaviour:

```txt
fixed mode:
  returns existing camera unchanged

follow mode:
  calculates target offset
  interpolates current offset toward target
  returns a new camera state
```

---

# Why Persistence Matters

Smoothing only works if the smoothed camera offset is persisted.

Incorrect:

```txt
Every render starts from offset 0.
Camera repeatedly moves only the first 12%.
```

Correct:

```txt
Frame 1:
0 → 12

Frame 2:
12 → 22.56

Frame 3:
22.56 → 31.85
```

That requires storing the next camera offset back into the simulation store.

---

# Store Integration

Recommended action:

```ts
setCamera: (camera: CameraState) => void;
```

Implementation:

```ts
setCamera: (camera) =>
  set(() => ({
    camera,
  }));
```

Selector:

```ts
export const useSetCamera = () => useSimulationStore((state) => state.setCamera);
```

---

# SimulationCanvas Integration

Recommended flow:

```tsx
const camera = useSimulationCamera();
const setCamera = useSetCamera();

const renderCamera = resolveCameraForView(camera, car, {
  width: dimensions.width,
  height: dimensions.height,
});

if (renderCamera !== camera) {
  setCamera(renderCamera);
}

drawSimulationFrame(context, road, car, {
  camera: renderCamera,
  road: {
    showCenterGuide: ui.isDebugModeEnabled,
  },
});
```

---

# Stability Behaviour

## Stationary Car

If the car does not move and the camera is already near the target:

```txt
target offset remains stable
camera offset changes less each frame
visual jitter reduces
```

## Moving Car

If the car moves:

```txt
target offset changes
camera follows gradually
road motion appears smoother
```

## Snap Mode for Tests

To test direct target alignment:

```ts
resolveCameraForView(camera, car, viewport, 1);
```

A smoothing factor of `1` means:

```txt
snap directly to target
```

---

# Testing Strategy

## Lerp Tests

Verify:

```txt
0 → 100 at 0.12 = 12
10 → 20 at 0.5 = 15
0 smoothing returns current value
1 smoothing returns target value
```

---

## Offset Tests

Verify:

```txt
offsetX approaches target offsetX
offsetY approaches target offsetY
current object is not mutated
target object is not mutated
invalid offsets throw RangeError
```

---

## Camera Resolution Tests

Verify:

```txt
fixed camera returns the same object
follow camera returns a new smoothed camera
smoothing factor 1 snaps to target
smoothing factor 0 keeps current offset
invalid smoothing factor throws RangeError
```

---

## Multi-Frame Tests

Verify:

```txt
offset approaches target over multiple frames
distance to target decreases each frame
camera does not overshoot when smoothing is between 0 and 1
```

Example:

```txt
Target = 100
Frame 1 = 12
Frame 2 = 22.56
Frame 3 = 31.85
```

---

# Acceptance Criteria

This task is complete when:

```txt
Camera offset moves gradually toward target.
Camera does not snap abruptly during normal movement.
Smoothing is configurable.
Camera remains stable when car is stationary.
Tests verify offset approaches target over frames.
```

---

# Traceability KPI

```txt
Camera follow movement is smooth and deterministic.
```

Success means:

```txt
Given the same current offset, target offset, and smoothing factor, the next camera offset is always the same.
```

---

# Engineering Lessons Learned

## Smooth the Camera, Not the Car

The car's world position must remain exact.

Only the camera offset should be smoothed.

---

## Smoothing Needs Memory

Linear interpolation requires the previous camera offset.

That is why the smoothed result must be persisted.

---

## Smoothing Factor Is a Design Control

Small values feel smooth but delayed.

Large values feel responsive but may look snappy.

MVP value:

```txt
0.12
```

is a reasonable balance.

---

# Future Evolution

This smoothing foundation prepares the simulator for:

```txt
Time-scaled smoothing
Spring-damper camera
Predictive look-ahead
Speed-aware camera distance
Camera bounds
Shake effects
Zoom smoothing
Replay camera interpolation
Cinematic camera modes
```

The stable rule remains:

```txt
Camera smoothing changes only the rendered view, never simulation truth.
```
