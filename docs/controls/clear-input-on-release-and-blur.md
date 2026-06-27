# Clear Input on Release and Blur

## Purpose

Keyboard input must never remain active after the physical key is released or after the browser loses focus.

This prevents stuck movement such as:

```txt
Car keeps accelerating after tab switch.
Car keeps steering after focus loss.
Car keeps braking because keyup never fired.
```

The hook must treat input as active-key state, not as isolated key events.

---

# Scope

This document covers **Phase 1.8.6 — Clear Input on Key Release and Focus Loss**.

This phase strengthens the keyboard controls hook by ensuring input is cleared correctly on:

```txt
keyup
window blur
component unmount
tab switch
lost focus while key is held
```

It does **not** implement:

```txt
Physics movement
Game loop updates
Canvas rendering
CarState mutation
AI input
Gamepad input
Touch controls
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

# Recommended Internal Structure

Use an active key set:

```ts
export interface KeyboardControlState {
  /**
   * Physical keyboard codes currently held down.
   */
  pressedCodes: ReadonlySet<string>;
}
```

Initial state:

```ts
const INITIAL_KEYBOARD_CONTROL_STATE = {
  pressedCodes: new Set<string>(),
};
```

---

# Why Use `Set<string>`

Multiple keys can map to the same action.

Example:

```txt
W and ArrowUp both mean accelerate.
```

A boolean can fail:

```txt
W down        -> accelerating true
ArrowUp down  -> accelerating true
W up          -> accelerating false, even though ArrowUp is still held
```

A set works:

```txt
pressedCodes = {"KeyW", "ArrowUp"}
release KeyW
pressedCodes = {"ArrowUp"}
acceleration remains active
```

---

# Key Release Rule

On `keyup`, remove only the released key.

```ts
function removePressedCode(
  pressedCodes: ReadonlySet<string>,
  code: string,
): ReadonlySet<string> {
  if (!pressedCodes.has(code)) {
    return pressedCodes;
  }

  const nextCodes = new Set(pressedCodes);
  nextCodes.delete(code);
  return nextCodes;
}
```

This guarantees that releasing one key does not clear another key that maps to the same action.

---

# Window Blur Rule

When the window loses focus, clear all active keys.

```ts
function clearAllActiveKeys(): void {
  setKeyboardState(INITIAL_KEYBOARD_CONTROL_STATE);
}
```

Reason:

```txt
Browsers may not dispatch keyup after tab switch or focus loss.
```

Without this rule, controls can become stuck.

---

# Component Unmount Rule

On unmount:

```txt
Remove all event listeners.
Clear active input state.
```

Recommended cleanup:

```ts
return () => {
  window.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("keyup", handleKeyUp);
  window.removeEventListener("blur", clearAllActiveKeys);

  clearAllActiveKeys();
};
```

---

# Repeated Keydown Rule

Browsers fire repeated keydown events when a key is held.

The hook should ignore repeated keydown events:

```ts
if (event.repeat) {
  return;
}
```

This prevents unnecessary state updates.

---

# Event Listener Responsibilities

The hook should add listeners on mount:

```ts
window.addEventListener("keydown", handleKeyDown);
window.addEventListener("keyup", handleKeyUp);
window.addEventListener("blur", clearAllActiveKeys);
```

And remove them on unmount:

```ts
window.removeEventListener("keydown", handleKeyDown);
window.removeEventListener("keyup", handleKeyUp);
window.removeEventListener("blur", clearAllActiveKeys);
```

---

# Input Derivation Flow

```txt
pressedCodes
    ↓
derive acceleration
    ↓
derive brake/reverse intent
    ↓
derive steering input
    ↓
createCarPhysicsInput()
    ↓
CarPhysicsInput
```

The hook should never expose raw pressed-key state to physics.

---

# Behaviour Examples

## Multiple Acceleration Keys

```txt
KeyW down
ArrowUp down
KeyW up
```

Expected:

```txt
Acceleration remains active because ArrowUp is still held.
```

---

## Steering Release

```txt
ArrowLeft down
ArrowRight down
ArrowLeft up
```

Expected:

```txt
Steering becomes right because ArrowRight is still held.
```

---

## Blur While Accelerating

```txt
KeyW down
window blur
```

Expected:

```txt
isAccelerating = false
```

---

## Blur While Steering

```txt
ArrowRight down
window blur
```

Expected:

```txt
steeringInput = 0
```

---

# Hook Non-Responsibilities

`useKeyboardControls()` must not:

```txt
Run updateCarPhysics()
Mutate CarState
Read car.speed
Read Zustand directly
Start requestAnimationFrame
Draw to canvas
Read canvas context
```

---

# Testing Strategy

## Release Tests

Verify:

```txt
keyup clears only the released key.
Holding W and ArrowUp keeps acceleration active until both are released.
Holding ArrowLeft and A keeps left steering active until both are released.
Holding ArrowRight and D keeps right steering active until both are released.
```

---

## Blur Tests

Verify:

```txt
Window blur clears acceleration.
Window blur clears brake/reverse intent.
Window blur clears steering.
Window blur clears all active input simultaneously.
```

---

## Cleanup Tests

Verify:

```txt
Unmount removes keydown listener.
Unmount removes keyup listener.
Unmount removes blur listener.
Unmount does not leave input stuck.
```

---

## Edge Tests

Verify:

```txt
Repeated keydown is safe.
Unknown keys are ignored.
Keyup for an unpressed tracked key is safe.
Blur when no keys are pressed is safe.
```

---

# Acceptance Criteria

This task is complete when:

```txt
Key release clears only the released key.
Holding W and ArrowUp keeps acceleration active until both are released.
Window blur clears all active inputs.
Unmount removes all event listeners.
No stuck movement after tab switch.
Tests verify release, blur, and cleanup behaviour.
```

---

# Traceability KPI

```txt
Input state never remains active after physical key release or focus loss.
```

Success means:

```txt
There is no ghost acceleration, ghost braking, or ghost steering after key release, tab switch, blur, or component unmount.
```

---

# Engineering Lessons Learned

## Keyboard Events Are Transitions

`keydown` and `keyup` are not the full state.

They are changes to state.

The reliable model is:

```txt
active keys currently held
```

---

## Blur Is a Safety Reset

Focus loss is dangerous for real-time controls.

The safest behaviour is to clear all input immediately.

---

## Cleanup Prevents Duplicate Controls

If listeners are not removed, remounting the hook can attach duplicate handlers.

That causes confusing input bugs.

---

# Future Evolution

This input safety model prepares the simulator for:

```txt
Gamepad disconnect handling
Touch cancel events
Pointer capture loss
Replay stop events
AI/manual control switching
Emergency input reset
Accessibility input devices
```

The stable principle remains:

```txt
When physical input is gone, normalized input must return to neutral.
```
