/**
 * Tests for useCanvasResize.
 *
 * These tests validate resize lifecycle behavior without testing drawing,
 * physics, AI, or game-loop behavior.
 */

import { useRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "../tests/test-utils";
import { useCanvasResize } from "./useCanvasResize";

class MockResizeObserver {
  static instances: MockResizeObserver[] = [];

  observe = vi.fn();
  disconnect = vi.fn();

  private readonly callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    MockResizeObserver.instances.push(this);
  }

  trigger() {
    this.callback([], this as unknown as ResizeObserver);
  }
}

function ResizeTestComponent({
  resizeCanvas,
  onResize,
}: {
  resizeCanvas: (size: { width: number; height: number }) => {
    width: number;
    height: number;
    pixelRatio: number;
  } | null;
  onResize?: (dimensions: { width: number; height: number; pixelRatio: number }) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useCanvasResize({
    containerRef,
    resizeCanvas,
    onResize,
  });

  return <div ref={containerRef} data-testid="canvas-container" />;
}

describe("useCanvasResize", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    MockResizeObserver.instances = [];
  });

  it("observes the canvas container when ResizeObserver is available", () => {
    vi.stubGlobal("ResizeObserver", MockResizeObserver);

    const resizeCanvas = vi.fn(() => ({
      width: 800,
      height: 400,
      pixelRatio: 1,
    }));

    render(<ResizeTestComponent resizeCanvas={resizeCanvas} />);

    expect(MockResizeObserver.instances).toHaveLength(1);
    expect(MockResizeObserver.instances[0]?.observe).toHaveBeenCalledTimes(1);
    expect(resizeCanvas).toHaveBeenCalledTimes(1);
  });

  it("disconnects ResizeObserver on unmount", () => {
    vi.stubGlobal("ResizeObserver", MockResizeObserver);

    const resizeCanvas = vi.fn(() => ({
      width: 800,
      height: 400,
      pixelRatio: 1,
    }));

    const { unmount } = render(<ResizeTestComponent resizeCanvas={resizeCanvas} />);

    unmount();

    expect(MockResizeObserver.instances[0]?.disconnect).toHaveBeenCalledTimes(1);
  });

  it("calls onResize when resizeCanvas returns dimensions", () => {
    vi.stubGlobal("ResizeObserver", MockResizeObserver);

    const onResize = vi.fn();

    const resizeCanvas = vi.fn(() => ({
      width: 800,
      height: 400,
      pixelRatio: 2,
    }));

    render(<ResizeTestComponent resizeCanvas={resizeCanvas} onResize={onResize} />);

    expect(onResize).toHaveBeenCalledWith({
      width: 800,
      height: 400,
      pixelRatio: 2,
    });
  });

  it("falls back to window resize listener when ResizeObserver is unavailable", () => {
    vi.stubGlobal("ResizeObserver", undefined);

    const addEventListenerSpy = vi.spyOn(window, "addEventListener");
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

    const resizeCanvas = vi.fn(() => ({
      width: 800,
      height: 400,
      pixelRatio: 1,
    }));

    const { unmount } = render(<ResizeTestComponent resizeCanvas={resizeCanvas} />);

    expect(addEventListenerSpy).toHaveBeenCalledWith("resize", expect.any(Function));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith("resize", expect.any(Function));
  });

  it("does not call onResize when resizeCanvas returns null", () => {
    vi.stubGlobal("ResizeObserver", MockResizeObserver);

    const onResize = vi.fn();
    const resizeCanvas = vi.fn(() => null);

    render(<ResizeTestComponent resizeCanvas={resizeCanvas} onResize={onResize} />);

    expect(onResize).not.toHaveBeenCalled();
  });
});
