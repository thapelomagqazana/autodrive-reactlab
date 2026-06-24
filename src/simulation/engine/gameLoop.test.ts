/**
 * Unit tests for the game loop module.
 */

import { describe, expect, it, vi } from "vitest";
import { createGameLoop } from "./gameLoop";

function createMockScheduler() {
  const callbacks: FrameRequestCallback[] = [];

  const requestFrame = vi.fn((callback: FrameRequestCallback) => {
    callbacks.push(callback);
    return callbacks.length;
  });

  const cancelFrame = vi.fn();

  const runFrame = (timestampMs: number) => {
    const callback = callbacks.shift();

    if (!callback) {
      throw new Error("No frame callback scheduled.");
    }

    callback(timestampMs);
  };

  return {
    requestFrame,
    cancelFrame,
    runFrame,
    scheduledCount: () => callbacks.length,
  };
}

describe("createGameLoop", () => {
  it("starts the loop using requestAnimationFrame", () => {
    const scheduler = createMockScheduler();

    const loop = createGameLoop({
      requestFrame: scheduler.requestFrame,
      cancelFrame: scheduler.cancelFrame,
    });

    loop.start({
      update: vi.fn(),
      render: vi.fn(),
    });

    expect(loop.isRunning()).toBe(true);
    expect(scheduler.requestFrame).toHaveBeenCalledTimes(1);
  });

  it("executes update and render once per frame", () => {
    const scheduler = createMockScheduler();
    const update = vi.fn();
    const render = vi.fn();

    const loop = createGameLoop({
      requestFrame: scheduler.requestFrame,
      cancelFrame: scheduler.cancelFrame,
    });

    loop.start({ update, render });

    scheduler.runFrame(1000);

    expect(update).toHaveBeenCalledTimes(1);
    expect(render).toHaveBeenCalledTimes(1);
  });

  it("passes safe zero delta time on the first frame", () => {
    const scheduler = createMockScheduler();
    const update = vi.fn();
    const render = vi.fn();

    const loop = createGameLoop({
      requestFrame: scheduler.requestFrame,
      cancelFrame: scheduler.cancelFrame,
    });

    loop.start({ update, render });

    scheduler.runFrame(1000);

    expect(update).toHaveBeenCalledWith({
      deltaTimeSeconds: 0,
      timestampMs: 1000,
    });
  });

  it("calculates delta time in seconds", () => {
    const scheduler = createMockScheduler();
    const update = vi.fn();
    const render = vi.fn();

    const loop = createGameLoop({
      requestFrame: scheduler.requestFrame,
      cancelFrame: scheduler.cancelFrame,
    });

    loop.start({ update, render });

    scheduler.runFrame(1000);
    scheduler.runFrame(1016);

    expect(update).toHaveBeenLastCalledWith({
      deltaTimeSeconds: 0.016,
      timestampMs: 1016,
    });
  });

  it("caps large delta time jumps", () => {
    const scheduler = createMockScheduler();
    const update = vi.fn();
    const render = vi.fn();

    const loop = createGameLoop({
      requestFrame: scheduler.requestFrame,
      cancelFrame: scheduler.cancelFrame,
      maxDeltaTimeSeconds: 0.1,
    });

    loop.start({ update, render });

    scheduler.runFrame(1000);
    scheduler.runFrame(5000);

    expect(update).toHaveBeenLastCalledWith({
      deltaTimeSeconds: 0.1,
      timestampMs: 5000,
    });
  });

  it("does not create duplicate loops when start is called twice", () => {
    const scheduler = createMockScheduler();

    const loop = createGameLoop({
      requestFrame: scheduler.requestFrame,
      cancelFrame: scheduler.cancelFrame,
    });

    const callbacks = {
      update: vi.fn(),
      render: vi.fn(),
    };

    loop.start(callbacks);
    loop.start(callbacks);

    expect(scheduler.requestFrame).toHaveBeenCalledTimes(1);
  });

  it("stops the loop by cancelling the pending animation frame", () => {
    const scheduler = createMockScheduler();

    const loop = createGameLoop({
      requestFrame: scheduler.requestFrame,
      cancelFrame: scheduler.cancelFrame,
    });

    loop.start({
      update: vi.fn(),
      render: vi.fn(),
    });

    loop.stop();

    expect(loop.isRunning()).toBe(false);
    expect(scheduler.cancelFrame).toHaveBeenCalledWith(1);
  });

  it("allows stop before start", () => {
    const scheduler = createMockScheduler();

    const loop = createGameLoop({
      requestFrame: scheduler.requestFrame,
      cancelFrame: scheduler.cancelFrame,
    });

    expect(() => loop.stop()).not.toThrow();
    expect(loop.isRunning()).toBe(false);
  });

  it("allows stop to be called multiple times", () => {
    const scheduler = createMockScheduler();

    const loop = createGameLoop({
      requestFrame: scheduler.requestFrame,
      cancelFrame: scheduler.cancelFrame,
    });

    loop.start({
      update: vi.fn(),
      render: vi.fn(),
    });

    expect(() => {
      loop.stop();
      loop.stop();
    }).not.toThrow();
  });

  it("does not continue after stop", () => {
    const scheduler = createMockScheduler();
    const update = vi.fn();
    const render = vi.fn();

    const loop = createGameLoop({
      requestFrame: scheduler.requestFrame,
      cancelFrame: scheduler.cancelFrame,
    });

    loop.start({ update, render });
    loop.stop();

    scheduler.runFrame(1000);

    expect(update).not.toHaveBeenCalled();
    expect(render).not.toHaveBeenCalled();
  });

  it("resets timing state after stop and restart", () => {
    const scheduler = createMockScheduler();
    const update = vi.fn();
    const render = vi.fn();

    const loop = createGameLoop({
      requestFrame: scheduler.requestFrame,
      cancelFrame: scheduler.cancelFrame,
    });

    loop.start({ update, render });
    scheduler.runFrame(1000);

    loop.stop();

    loop.start({ update, render });
    scheduler.runFrame(5000);

    expect(update).toHaveBeenLastCalledWith({
      deltaTimeSeconds: 0,
      timestampMs: 5000,
    });
  });

  it("reports FPS only after the sampling interval", () => {
    const scheduler = createMockScheduler();
    const onFps = vi.fn();

    const loop = createGameLoop({
      requestFrame: scheduler.requestFrame,
      cancelFrame: scheduler.cancelFrame,
      fpsSampleIntervalMs: 1000,
    });

    loop.start({
      update: vi.fn(),
      render: vi.fn(),
      onFps,
    });

    scheduler.runFrame(0);
    scheduler.runFrame(250);
    scheduler.runFrame(500);
    scheduler.runFrame(750);

    expect(onFps).not.toHaveBeenCalled();

    scheduler.runFrame(1000);

    expect(onFps).toHaveBeenCalledWith(5);
  });
});