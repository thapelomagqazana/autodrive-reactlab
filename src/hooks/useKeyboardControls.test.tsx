import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useKeyboardControls } from "./useKeyboardControls";

function keyDown(code: string, repeat = false) {
  window.dispatchEvent(
    new KeyboardEvent("keydown", {
      code,
      repeat,
      bubbles: true,
      cancelable: true,
    }),
  );
}

function keyUp(code: string) {
  window.dispatchEvent(
    new KeyboardEvent("keyup", {
      code,
      bubbles: true,
      cancelable: true,
    }),
  );
}

function blurWindow() {
  window.dispatchEvent(new Event("blur"));
}

describe("useKeyboardControls", () => {
  it("returns neutral physics input by default", () => {
    const { result } = renderHook(() => useKeyboardControls());

    expect(result.current).toEqual({
      isAccelerating: false,
      isBraking: false,
      steeringInput: 0,
    });
  });

  it("maps ArrowUp to acceleration", () => {
    const { result } = renderHook(() => useKeyboardControls());

    act(() => {
      keyDown("ArrowUp");
    });

    expect(result.current.isAccelerating).toBe(true);
    expect(result.current.isBraking).toBe(false);
  });

  it("maps ArrowDown to braking", () => {
    const { result } = renderHook(() => useKeyboardControls());

    act(() => {
      keyDown("ArrowDown");
    });

    expect(result.current.isBraking).toBe(true);
    expect(result.current.isAccelerating).toBe(false);
  });

  it("maps left and right steering to normalized input", () => {
    const { result } = renderHook(() => useKeyboardControls());

    act(() => {
      keyDown("ArrowLeft");
    });

    expect(result.current.steeringInput).toBe(-1);

    act(() => {
      keyUp("ArrowLeft");
      keyDown("ArrowRight");
    });

    expect(result.current.steeringInput).toBe(1);
  });

  it("resolves opposite steering keys to neutral", () => {
    const { result } = renderHook(() => useKeyboardControls());

    act(() => {
      keyDown("ArrowLeft");
      keyDown("ArrowRight");
    });

    expect(result.current.steeringInput).toBe(0);
  });

  it("clears input on key release", () => {
    const { result } = renderHook(() => useKeyboardControls());

    act(() => {
      keyDown("ArrowUp");
      keyDown("ArrowLeft");
    });

    expect(result.current.isAccelerating).toBe(true);
    expect(result.current.steeringInput).toBe(-1);

    act(() => {
      keyUp("ArrowUp");
      keyUp("ArrowLeft");
    });

    expect(result.current).toEqual({
      isAccelerating: false,
      isBraking: false,
      steeringInput: 0,
    });
  });

  it("clears all input on window blur", () => {
    const { result } = renderHook(() => useKeyboardControls());

    act(() => {
      keyDown("ArrowUp");
      keyDown("ArrowRight");
    });

    expect(result.current.isAccelerating).toBe(true);
    expect(result.current.steeringInput).toBe(1);

    act(() => {
      blurWindow();
    });

    expect(result.current).toEqual({
      isAccelerating: false,
      isBraking: false,
      steeringInput: 0,
    });
  });

  it("ignores repeated keydown events", () => {
    const { result } = renderHook(() => useKeyboardControls());

    act(() => {
      keyDown("ArrowUp");
      keyDown("ArrowUp", true);
    });

    expect(result.current.isAccelerating).toBe(true);
  });

  it("ignores untracked keys", () => {
    const { result } = renderHook(() => useKeyboardControls());

    act(() => {
      keyDown("Space");
    });

    expect(result.current).toEqual({
      isAccelerating: false,
      isBraking: false,
      steeringInput: 0,
    });
  });

  it("removes event listeners on unmount", () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = renderHook(() => useKeyboardControls());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith("keyup", expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith("blur", expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });
});
