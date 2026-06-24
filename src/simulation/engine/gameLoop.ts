/**
 * Game loop module for AutoDrive ReactLab.
 *
 * Responsibilities:
 * - Own browser animation-frame lifecycle.
 * - Start and stop the loop safely.
 * - Calculate delta time in seconds.
 * - Cap large delta-time jumps.
 * - Report FPS at a controlled interval.
 *
 * Non-responsibilities:
 * - No React.
 * - No Zustand.
 * - No canvas drawing.
 * - No vehicle physics.
 * - No AI decisions.
 * - No collision detection.
 */

export interface GameLoopTick {
  /**
   * Time elapsed since the previous frame, measured in seconds.
   */
  deltaTimeSeconds: number;

  /**
   * Current requestAnimationFrame timestamp, measured in milliseconds.
   */
  timestampMs: number;
}

export interface GameLoopCallbacks {
  /**
   * Runs simulation update work.
   *
   * Future examples:
   * - vehicle movement
   * - sensor updates
   * - AI decision timing
   */
  update: (tick: GameLoopTick) => void;

  /**
   * Runs render work.
   *
   * Future examples:
   * - clear canvas
   * - draw world
   * - draw vehicle
   * - draw sensors
   */
  render: (tick: GameLoopTick) => void;

  /**
   * Receives sampled FPS updates.
   *
   * This should not fire every frame.
   */
  onFps?: (fps: number) => void;
}

export interface GameLoopOptions {
  /**
   * Maximum delta time allowed per frame.
   *
   * Prevents large jumps after browser tab inactivity or pause/resume.
   */
  maxDeltaTimeSeconds?: number;

  /**
   * FPS sampling window in milliseconds.
   */
  fpsSampleIntervalMs?: number;

  /**
   * Injectable requestAnimationFrame for tests.
   */
  requestFrame?: (callback: FrameRequestCallback) => number;

  /**
   * Injectable cancelAnimationFrame for tests.
   */
  cancelFrame?: (frameId: number) => void;
}

export interface GameLoopController {
  start: (callbacks: GameLoopCallbacks) => void;
  stop: () => void;
  isRunning: () => boolean;
}

const DEFAULT_MAX_DELTA_TIME_SECONDS = 0.1;
const DEFAULT_FPS_SAMPLE_INTERVAL_MS = 1000;

function normalizePositiveNumber(value: number | undefined, fallback: number): number {
  if (!Number.isFinite(value) || value === undefined || value <= 0) {
    return fallback;
  }

  return value;
}

/**
 * Creates a reusable game loop controller.
 *
 * The controller owns animation-frame lifecycle only.
 * It does not know anything about cars, roads, sensors, AI, or canvas drawing.
 */
export function createGameLoop(options: GameLoopOptions = {}): GameLoopController {
  const maxDeltaTimeSeconds = normalizePositiveNumber(
    options.maxDeltaTimeSeconds,
    DEFAULT_MAX_DELTA_TIME_SECONDS,
  );

  const fpsSampleIntervalMs = normalizePositiveNumber(
    options.fpsSampleIntervalMs,
    DEFAULT_FPS_SAMPLE_INTERVAL_MS,
  );

  const requestFrame =
    options.requestFrame ?? window.requestAnimationFrame.bind(window);

  const cancelFrame =
    options.cancelFrame ?? window.cancelAnimationFrame.bind(window);

  let running = false;
  let frameId: number | null = null;
  let previousTimestampMs: number | null = null;

  let fpsFrameCount = 0;
  let fpsWindowStartMs: number | null = null;

  function resetTimingState(): void {
    previousTimestampMs = null;
    fpsFrameCount = 0;
    fpsWindowStartMs = null;
  }

  function scheduleNextFrame(callbacks: GameLoopCallbacks): void {
    frameId = requestFrame((timestampMs) => {
      if (!running) {
        return;
      }

      const rawDeltaSeconds =
        previousTimestampMs === null
          ? 0
          : (timestampMs - previousTimestampMs) / 1000;

      const deltaTimeSeconds = Math.min(
        Math.max(0, rawDeltaSeconds),
        maxDeltaTimeSeconds,
      );

      previousTimestampMs = timestampMs;

      const tick: GameLoopTick = {
        deltaTimeSeconds,
        timestampMs,
      };

      callbacks.update(tick);
      callbacks.render(tick);

      fpsFrameCount += 1;

      if (fpsWindowStartMs === null) {
        fpsWindowStartMs = timestampMs;
      }

      const fpsElapsedMs = timestampMs - fpsWindowStartMs;

      if (fpsElapsedMs >= fpsSampleIntervalMs) {
        const fps = Math.round((fpsFrameCount * 1000) / fpsElapsedMs);

        callbacks.onFps?.(fps);

        fpsFrameCount = 0;
        fpsWindowStartMs = timestampMs;
      }

      scheduleNextFrame(callbacks);
    });
  }

  function start(callbacks: GameLoopCallbacks): void {
    if (running) {
      return;
    }

    running = true;
    resetTimingState();
    scheduleNextFrame(callbacks);
  }

  function stop(): void {
    if (!running && frameId === null) {
      return;
    }

    running = false;

    if (frameId !== null) {
      cancelFrame(frameId);
      frameId = null;
    }

    resetTimingState();
  }

  function isRunning(): boolean {
    return running;
  }

  return {
    start,
    stop,
    isRunning,
  };
}