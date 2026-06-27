# Left Steering Key Mapping

## Purpose

Left steering key mapping converts left-turn keyboard input into normalized steering intent:

```ts
steeringInput: -1;
```

The keyboard hook does not rotate the car directly.

It only communicates steering intent to the physics layer.

---

# Scope

This document covers **Phase 1.8.4 — Map ArrowLeft / A to Steer Left**.

This phase maps:

```txt
ArrowLeft
A
a
```

to:

```ts
steeringInput = -1;
```

It does **not** implement:

```txt
Steering physics
Heading updates
Position updates
Canvas rendering
Game-loop updates
CarState mutation
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

With steering represented as:

```ts
steeringInput: number;
```

---

# Steering Convention

```txt
-1 = full left
 0 = no steering intent
 1 = full right
```

Therefore left steering must always map to:

```txt
-1
```

---

# Key Mapping

Recommended key codes:

```txt
ArrowLeft -> left steering
KeyA      -> left steering
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

Both lowercase `a` and uppercase `A` are represented by:

```txt
KeyA
```

---

# Recommended Key Set

```ts
const LEFT_KEYS = new Set(["ArrowLeft", "KeyA"]);
```

---

# Held-Key Rule

Left steering remains active while at least one left key is held.

Example:

```txt
ArrowLeft down -> steeringInput = -1
A down         -> steeringInput = -1
ArrowLeft up   -> steeringInput still -1 because A is held
A up           -> steeringInput = 0
```

This prevents one left-key release from clearing left steering while another left key remains pressed.

---

# Opposing Steering Rule

If left and right steering are both active:

```txt
left + right = neutral steering
```

Output:

```ts
steeringInput: 0;
```

This is deterministic and avoids impossible steering intent.

---

# Recommended Resolver

```ts
function resolveSteeringInput(pressedCodes: ReadonlySet<string>): number {
  const isLeftPressed = hasAnyPressedKey(pressedCodes, LEFT_KEYS);

  const isRightPressed = hasAnyPressedKey(pressedCodes, RIGHT_KEYS);

  if (isLeftPressed && !isRightPressed) {
    return -1;
  }

  if (isRightPressed && !isLeftPressed) {
    return 1;
  }

  return 0;
}
```

---

# Why a Set Is Better Than a Boolean

A boolean such as:

```ts
isLeftPressed: boolean;
```

is not enough when multiple keys map to the same command.

Problem:

```txt
ArrowLeft down -> true
A down         -> true
ArrowLeft up   -> false, even though A is still held
```

Better model:

```ts
pressedCodes: Set<string>;
```

Then the hook can ask:

```txt
Is any left key currently held?
```

---

# Repeated Keydown Rule

Browsers emit repeated keydown events when a key is held.

The hook should ignore repeated keydown events:

```ts
if (event.repeat) {
  return;
}
```

This avoids unnecessary state updates.

---

# Key Release Rule

Releasing a left key removes only that key from the pressed-key set.

It must not clear left steering if another left key remains held.

Correct:

```txt
ArrowLeft + A held
ArrowLeft released
steeringInput remains -1
```

Incorrect:

```txt
ArrowLeft + A held
ArrowLeft released
steeringInput becomes 0
```

---

# Window Blur Rule

Window blur clears all pressed keys.

Reason:

```txt
If the tab loses focus while ArrowLeft or A is held,
the keyup event may never fire.
```

This prevents stuck steering.

---

# Hook Non-Responsibilities

`useKeyboardControls()` must not:

```txt
Mutate CarState
Update car.angle
Update car.steeringAngle
Update car.positionX
Run updateCarPhysics()
Read canvas context
Start the game loop
Draw to canvas
```

---

# Normalization Flow

```txt
KeyboardEvent
    ↓
pressedCodes
    ↓
resolveSteeringInput()
    ↓
steeringInput = -1
    ↓
CarPhysicsInput
    ↓
Physics converts steering intent into steering angle
```

---

# Testing Strategy

## Positive Tests

Verify:

```txt
ArrowLeft sets steeringInput to -1.
KeyA sets steeringInput to -1.
Left steering remains active while key is held.
```

---

## Release Tests

Verify:

```txt
Releasing ArrowLeft clears steering if no other left key is held.
Releasing KeyA clears steering if no other left key is held.
Releasing ArrowLeft does not clear steering if KeyA is still held.
Releasing KeyA does not clear steering if ArrowLeft is still held.
```

---

## Opposing-Key Tests

Verify:

```txt
ArrowLeft + ArrowRight resolves to 0.
KeyA + KeyD resolves to 0.
Left + right conflict is deterministic.
Releasing left while right remains held returns steeringInput = 1.
```

---

## Repeat Tests

Verify:

```txt
Repeated ArrowLeft keydown is safe.
Repeated KeyA keydown is safe.
```

---

## Blur Tests

Verify:

```txt
Window blur clears left steering.
```

---

# Acceptance Criteria

This task is complete when:

```txt
ArrowLeft contributes left steering.
A contributes left steering.
Left-only input returns steeringInput = -1.
Left + right input returns steeringInput = 0.
Releasing left key updates steering correctly.
Tests verify ArrowLeft, A, and opposing-key behaviour.
```

---

# Traceability KPI

```txt
Left steering always maps to normalized negative input.
```

Success means:

```txt
No keyboard code directly changes car position, steering angle, or heading for left turns.
```

---

# Engineering Lessons Learned

## Left Is Intent, Not Movement

Pressing left should not move the car left.

It should only express left steering intent.

Physics decides whether and how that intent changes steering angle, heading, and position.

---

## Opposing Inputs Need a Rule

Without a clear rule, pressing left and right together can cause unstable or last-event-wins behaviour.

Neutral cancellation is simple and predictable.

---

## Held-Key State Is More Reliable Than Events

Keyboard events are transitions.

Driving controls need state.

That is why the hook tracks currently pressed keys.

---

# Future Evolution

This mapping prepares the simulator for:

```txt
Right steering mapping
Custom key bindings
Gamepad analog steering
Touch steering controls
AI steering input
Replay steering input
Accessibility remapping
```

The stable rule remains:

```txt
Left steering becomes steeringInput = -1.
```
