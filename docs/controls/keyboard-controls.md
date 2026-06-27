# Keyboard Controls

## Purpose

The keyboard controls hook converts raw browser keyboard events into normalized simulation input.

The hook is an input adapter.

It does not move the car directly.

It does not update physics directly.

It only exposes a typed `CarPhysicsInput` object that the simulation engine can consume.

---

# Scope

This document covers **Phase 1.8.1 — Create Keyboard Controls Hook**.

This phase introduces:

```txt
useKeyboardControls()
```

The hook supports:

```txt
Acceleration
Brake / reverse intent
Left steering
Right steering
Key release
Window blur
Repeated keydown handling
```

It does not implement:

```txt
Physics updates
Car movement
Canvas rendering
Game loop start/stop
AI input
Gamepad input
Touch controls
Replay input
```

---

# File Location

```txt
src/hooks/useKeyboardControls.ts
```

Related tests:

```txt
src/hooks/useKeyboardControls.test.tsx
```

---

# Public API

```ts
useKeyboardControls(): CarPhysicsInput;
```

Recommended return shape:

```ts
{
  isAccelerating: boolean;
  isBraking: boolean;
  steeringInput: number;
}
```

---

# Keyboard Mapping

Recommended MVP mapping:

```txt
ArrowUp / W      = accelerate
ArrowDown / S    = brake / reverse intent
ArrowLeft / A    = steer left
ArrowRight / D   = steer right
```

Use `KeyboardEvent.code`, not `KeyboardEvent.key`, because `code` represents the physical key location more consistently.

---

# Steering Mapping

Steering is normalized:

```txt
-1 = full left
 0 = no steering input
 1 = full right
```

Rules:

```txt
Left only        -> -1
Right only       -> 1
Left + Right     -> 0
Neither pressed  -> 0
```

This avoids conflicting steering intent.

---

# Acceleration / Brake Conflict

Recommended MVP conflict rule:

```txt
Accelerate only        -> isAccelerating = true
Brake only             -> isBraking = true
Accelerate + Brake     -> both false
Neither pressed        -> both false
```

This avoids impossible input where the car accelerates and brakes at the same time.

---

# Responsibilities

`useKeyboardControls()` is responsible for:

```txt
Adding keyboard listeners on mount.
Removing keyboard listeners on unmount.
Tracking active control keys.
Clearing released keys.
Clearing all input on window blur.
Ignoring repeated keydown events.
Returning normalized CarPhysicsInput.
```

---

# Non-Responsibilities

`useKeyboardControls()` must not:

```txt
Mutate CarState.
Call updateCarPhysics().
Read Zustand directly.
Draw to canvas.
Read canvas context.
Start requestAnimationFrame.
Start the game loop.
```

---

# State Model

Recommended internal state:

```ts
export interface KeyboardControlState {
  isAcceleratingPressed: boolean;
  isBrakingPressed: boolean;
  isLeftPressed: boolean;
  isRightPressed: boolean;
}
```

Neutral state:

```ts
const INITIAL_KEYBOARD_CONTROL_STATE = {
  isAcceleratingPressed: false,
  isBrakingPressed: false,
  isLeftPressed: false,
  isRightPressed: false,
};
```

---

# Event Listeners

The hook should attach:

```txt
keydown
keyup
blur
```

On cleanup, it must remove all three.

```ts
window.addEventListener("keydown", handleKeyDown);
window.addEventListener("keyup", handleKeyUp);
window.addEventListener("blur", handleWindowBlur);

return () => {
  window.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("keyup", handleKeyUp);
  window.removeEventListener("blur", handleWindowBlur);
};
```

---

# Repeated Keydown Rule

Browsers fire repeated `keydown` events while a key is held.

The hook should ignore repeated keydown events:

```ts
if (event.repeat) {
  return;
}
```

This avoids unnecessary state updates.

---

# Window Blur Rule

If the browser tab loses focus while a key is held, the matching keyup event may never arrive.

To avoid stuck controls:

```ts
function handleWindowBlur(): void {
  setKeyboardState(INITIAL_KEYBOARD_CONTROL_STATE);
}
```

---

# Normalization Flow

```txt
Browser keyboard event
        ↓
KeyboardControlState
        ↓
resolve steering / throttle conflicts
        ↓
createCarPhysicsInput()
        ↓
CarPhysicsInput
        ↓
updateCarPhysics()
```

---

# Recommended Implementation Shape

```ts
export function useKeyboardControls(): CarPhysicsInput {
  const [keyboardState, setKeyboardState] = useState(INITIAL_KEYBOARD_CONTROL_STATE);

  useEffect(() => {
    // attach keydown, keyup, blur listeners
    // cleanup on unmount
  }, []);

  return useMemo(
    () =>
      createCarPhysicsInput({
        isAccelerating:
          keyboardState.isAcceleratingPressed && !keyboardState.isBrakingPressed,

        isBraking: keyboardState.isBrakingPressed && !keyboardState.isAcceleratingPressed,

        steeringInput: resolveSteeringInput(keyboardState),
      }),
    [keyboardState],
  );
}
```

---

# Testing Strategy

## Positive Tests

Verify:

```txt
Default return value is neutral input.
ArrowUp maps to acceleration.
ArrowDown maps to braking.
ArrowLeft maps to steeringInput = -1.
ArrowRight maps to steeringInput = 1.
W / A / S / D mappings work.
```

---

## Conflict Tests

Verify:

```txt
Left + Right resolves to steeringInput = 0.
Accelerate + Brake resolves to neutral throttle/brake.
```

---

## Release Tests

Verify:

```txt
keyup clears acceleration.
keyup clears braking.
keyup clears left steering.
keyup clears right steering.
```

---

## Blur Tests

Verify:

```txt
window blur clears all active input.
```

---

## Cleanup Tests

Verify:

```txt
keydown listener is removed on unmount.
keyup listener is removed on unmount.
blur listener is removed on unmount.
```

---

## Edge Tests

Verify:

```txt
Repeated keydown does not break state.
Unknown keys are ignored.
Untracked keys do not call preventDefault unnecessarily.
```

---

# Acceptance Criteria

This task is complete when:

```txt
Hook returns a stable typed input object.
Hook adds keyboard listeners on mount.
Hook removes keyboard listeners on unmount.
Hook does not update car state directly.
Hook prevents stuck input after key release.
Hook clears active inputs on window blur.
Tests cover keydown, keyup, cleanup, and blur.
```

---

# Traceability KPI

```txt
100% of keyboard-to-physics input is normalized through one hook.
```

Success means:

```txt
No component manually translates keyboard events into car movement outside useKeyboardControls().
```

---

# Engineering Lessons Learned

## Keyboard Input Is Not Physics

Keyboard input is intent.

Physics decides how that intent affects speed, steering angle, heading, and position.

---

## Normalize Before Physics

The physics engine should receive a clean input object.

It should not know about raw browser keyboard events.

---

## Clear Input on Blur

Window blur handling prevents a common browser bug:

```txt
Key down happens.
Tab loses focus.
Key up never fires.
Car keeps accelerating forever.
```

The blur listener prevents that.

---

## Keep the Hook Small

The hook should only manage input state.

Do not let it grow into a game loop, physics engine, or renderer.

---

# Future Evolution

This hook prepares the project for:

```txt
Gamepad controls
Touch controls
AI control
Replay control
Scenario editor scripted input
Input recording
Control remapping
Accessibility controls
```

The stable principle remains:

```txt
Raw input becomes normalized CarPhysicsInput.
Physics owns movement.
```
