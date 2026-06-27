# Accelerate Key Mapping

## Purpose

The accelerate key mapping converts forward-driving keyboard input into the normalized physics flag:

```ts
isAccelerating: true;
```

This allows the physics engine to apply acceleration without knowing anything about browser keyboard events.

---

# Scope

This document covers **Phase 1.8.2 — Map ArrowUp / W to Acceleration**.

This phase maps:

```txt
ArrowUp
W
w
```

to:

```ts
isAccelerating: true;
```

It does **not** implement:

```txt
Physics acceleration
Car movement
Brake/reverse behaviour
Steering behaviour
Game loop wiring
Canvas rendering
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

# Public Output

The hook returns:

```ts
CarPhysicsInput;
```

With acceleration represented as:

```ts
isAccelerating: boolean;
```

---

# Key Mapping

Recommended key codes:

```txt
ArrowUp -> accelerate
KeyW    -> accelerate
```

Use:

```ts
event.code;
```

instead of:

```ts
event.key;
```

Reason:

```txt
event.code identifies the physical key.
event.key can vary by keyboard layout or casing.
```

This means both lowercase `w` and uppercase `W` are handled by:

```txt
KeyW
```

---

# Held-Key Rule

Acceleration remains active while at least one acceleration key is held.

Example:

```txt
ArrowUp down -> acceleration true
W down       -> acceleration true
ArrowUp up   -> acceleration still true because W is still held
W up         -> acceleration false
```

This prevents one key release from incorrectly clearing acceleration while another acceleration key remains pressed.

---

# Repeated Keydown Rule

Browsers fire repeated `keydown` events while a key is held.

The hook should ignore repeated keydown events:

```ts
if (event.repeat) {
  return;
}
```

This prevents unnecessary state updates and avoids confusing input transitions.

---

# Recommended Implementation Strategy

Track currently pressed key codes in a `Set`.

```ts
export interface KeyboardControlState {
  pressedCodes: ReadonlySet<string>;
}
```

Acceleration is derived from the set:

```ts
const isAcceleratingPressed = hasAnyPressedKey(
  keyboardState.pressedCodes,
  ACCELERATE_KEYS,
);
```

Then normalized into physics input:

```ts
createCarPhysicsInput({
  isAccelerating: isAcceleratingPressed && !isBrakingPressed,
});
```

---

# Why a Set Is Better Than a Boolean

A boolean cannot correctly represent multiple keys mapped to the same action.

Bad model:

```ts
isAcceleratingPressed: boolean;
```

Problem:

```txt
ArrowUp down -> true
W down       -> true
ArrowUp up   -> false, even though W is still held
```

Better model:

```ts
pressedCodes: Set<string>;
```

Now the hook can ask:

```txt
Is any acceleration key still held?
```

---

# Conflict with Braking

If acceleration and braking are both pressed, the MVP rule should resolve to neutral throttle/brake:

```txt
Accelerate + Brake = no acceleration and no braking
```

Recommended:

```ts
isAccelerating: isAcceleratingPressed && !isBrakingPressed;
```

This prevents impossible simultaneous throttle and brake commands.

---

# Cleanup Rule

The hook must remove event listeners on unmount:

```ts
return () => {
  window.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("keyup", handleKeyUp);
  window.removeEventListener("blur", handleWindowBlur);
};
```

This prevents leaked listeners and duplicate input processing.

---

# Window Blur Rule

Window blur must clear all pressed keys.

Reason:

```txt
If a key is held while the browser loses focus,
the keyup event may never fire.
```

Recommended:

```ts
function handleWindowBlur(): void {
  setKeyboardState(INITIAL_KEYBOARD_CONTROL_STATE);
}
```

---

# Testing Strategy

## Positive Tests

Verify:

```txt
ArrowUp sets isAccelerating to true.
KeyW sets isAccelerating to true.
Acceleration remains true while the key is held.
```

---

## Release Tests

Verify:

```txt
Releasing ArrowUp clears acceleration when no other acceleration key is held.
Releasing KeyW clears acceleration when no other acceleration key is held.
Releasing ArrowUp does not clear acceleration if KeyW is still held.
Releasing KeyW does not clear acceleration if ArrowUp is still held.
```

---

## Repeat Tests

Verify:

```txt
Repeated ArrowUp keydown is safe.
Repeated KeyW keydown is safe.
```

---

## Conflict Tests

Verify:

```txt
Acceleration is false when brake is also held.
```

---

## Blur Tests

Verify:

```txt
Window blur clears acceleration.
```

---

# Acceptance Criteria

This task is complete when:

```txt
ArrowUp sets isAccelerating to true.
W sets isAccelerating to true.
Releasing ArrowUp clears acceleration if no other accelerate key is held.
Releasing W clears acceleration if no other accelerate key is held.
Repeated keydown events are safe.
Tests verify ArrowUp and W behaviour.
```

---

# Traceability KPI

```txt
Forward motion is triggered by one normalized acceleration flag.
```

Success means:

```txt
Keyboard forward-driving input becomes only isAccelerating before physics receives it.
```

---

# Engineering Lessons Learned

## Map Many Keys to One Intent

The user may prefer arrow keys or WASD.

Both should produce the same physics intent.

Physics should not care which key was pressed.

---

## Track Held Keys, Not Last Events

Keyboard input is stateful.

The current set of held keys matters more than the most recent event.

---

## Normalize Before Physics

The keyboard hook should output:

```txt
isAccelerating
```

not:

```txt
ArrowUpPressed
WPressed
```

This keeps physics independent from the browser.

---

# Future Evolution

This mapping prepares the project for:

```txt
Custom key bindings
Gamepad acceleration
Mobile touch throttle
AI throttle input
Replay playback
Scenario-defined controls
Accessibility input modes
```

The stable rule remains:

```txt
All forward input becomes isAccelerating.
```
