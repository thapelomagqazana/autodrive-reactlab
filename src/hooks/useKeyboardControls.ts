import { useEffect, useMemo, useState } from "react";
import {
  createCarPhysicsInput,
  type CarPhysicsInput,
} from "../simulation/engine/physics";

export interface KeyboardControlState {
  pressedCodes: ReadonlySet<string>;
}

const INITIAL_KEYBOARD_CONTROL_STATE: KeyboardControlState = {
  pressedCodes: new Set<string>(),
};

const ACCELERATE_KEYS = new Set(["ArrowUp", "KeyW"]);
const BRAKE_OR_REVERSE_KEYS = new Set(["ArrowDown", "KeyS"]);
const LEFT_KEYS = new Set(["ArrowLeft", "KeyA"]);
const RIGHT_KEYS = new Set(["ArrowRight", "KeyD"]);

function isTrackedControlKey(code: string): boolean {
  return (
    ACCELERATE_KEYS.has(code) ||
    BRAKE_OR_REVERSE_KEYS.has(code) ||
    LEFT_KEYS.has(code) ||
    RIGHT_KEYS.has(code)
  );
}

function hasAnyPressedKey(
  pressedCodes: ReadonlySet<string>,
  targetCodes: ReadonlySet<string>,
): boolean {
  for (const code of targetCodes) {
    if (pressedCodes.has(code)) {
      return true;
    }
  }

  return false;
}

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

function addPressedCode(
  pressedCodes: ReadonlySet<string>,
  code: string,
): ReadonlySet<string> {
  if (pressedCodes.has(code)) {
    return pressedCodes;
  }

  return new Set([...pressedCodes, code]);
}

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

/**
 * Listens to keyboard controls and exposes normalized physics input.
 *
 * ArrowUp and W both map to isAccelerating.
 * Acceleration remains true while at least one acceleration key is held.
 */
export function useKeyboardControls(): CarPhysicsInput {
  const [keyboardState, setKeyboardState] = useState<KeyboardControlState>(
    INITIAL_KEYBOARD_CONTROL_STATE,
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (!isTrackedControlKey(event.code)) {
        return;
      }

      event.preventDefault();

      if (event.repeat) {
        return;
      }

      setKeyboardState((currentState) => ({
        pressedCodes: addPressedCode(currentState.pressedCodes, event.code),
      }));
    }

    function handleKeyUp(event: KeyboardEvent): void {
      if (!isTrackedControlKey(event.code)) {
        return;
      }

      event.preventDefault();

      setKeyboardState((currentState) => ({
        pressedCodes: removePressedCode(currentState.pressedCodes, event.code),
      }));
    }

    function handleWindowBlur(): void {
      setKeyboardState(INITIAL_KEYBOARD_CONTROL_STATE);
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, []);

  return useMemo(() => {
    const isAcceleratingPressed = hasAnyPressedKey(
      keyboardState.pressedCodes,
      ACCELERATE_KEYS,
    );

    const isBrakeOrReversePressed = hasAnyPressedKey(
      keyboardState.pressedCodes,
      BRAKE_OR_REVERSE_KEYS,
    );

    return createCarPhysicsInput({
      isAccelerating: isAcceleratingPressed && !isBrakeOrReversePressed,

      isBrakeOrReversePressed: isBrakeOrReversePressed && !isAcceleratingPressed,

      steeringInput: resolveSteeringInput(keyboardState.pressedCodes),
    });
  }, [keyboardState]);
}
