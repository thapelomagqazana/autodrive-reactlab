/**
 * Browser game loop module for AutoDrive ReactLab.
 *
 * This module owns animation-loop lifecycle only.
 *
 * Responsibilities:
 * - Start the browser animation loop.
 * - Stop/pause the browser animation loop.
 * - Calculate safe delta time.
 * - Calculate sampled FPS.
 * - Prevent duplicate loops.
 *
 * Non-responsibilities:
 * - No React.
 * - No Zustand.
 * - No physics.
 * - No AI.
 * - No rendering details.
 */

export interface GameLoopTick {
  timestampMs: number;
  deltaTimeSeconds: number;
}

export interface GameLoopCallbacks {
  update: (tick: GameLoopTick) => void;
  render: (tick: GameLoopTick) => void;

  /**
   * Called only after the configured FPS sampling interval.
   *
   * This prevents UI integrations from updating every animation frame.
   */
  onFps?: (fps: number) => void;
}

export interface GameLoopScheduler {
  requestFrame: (callback: FrameRequestCallback) => number;
  cancelFrame: (frameId: number) => void;
}

export interface GameLoopOptions {
  scheduler?: GameLoopScheduler;
  maxDeltaTimeSeconds?: number;
  fpsSampleIntervalMs?: number;
}

export interface GameLoopController {
  start: (callbacks: GameLoopCallbacks) => void;
  stop: () => void;
  isRunning: () => boolean;
}

const DEFAULT_MAX_DELTA_TIME_SECONDS = 0.1;
const DEFAULT_FPS_SAMPLE_INTERVAL_MS = 1000;

function createBrowserScheduler(): GameLoopScheduler {
  return {
    requestFrame: window.requestAnimationFrame.bind(window),
    cancelFrame: window.cancelAnimationFrame.bind(window),
  };
}

function normalizePositiveNumber(value: number | undefined, fallback: number): number {
  if (!Number.isFinite(value) || value === undefined || value <= 0) {
    return fallback;
  }

  return value;
}

function calculateDeltaTimeSeconds(
  previousTimestampMs: number | null,
  currentTimestampMs: number,
  maxDeltaTimeSeconds: number,
): number {
  if (previousTimestampMs === null || !Number.isFinite(currentTimestampMs)) {
    return 0;
  }

  const rawDeltaSeconds = (currentTimestampMs - previousTimestampMs) / 1000;

  if (!Number.isFinite(rawDeltaSeconds) || rawDeltaSeconds <= 0) {
    return 0;
  }

  return Math.min(rawDeltaSeconds, maxDeltaTimeSeconds);
}

export function createGameLoop(options: GameLoopOptions = {}): GameLoopController {
  const scheduler = options.scheduler ?? createBrowserScheduler();

  const maxDeltaTimeSeconds = normalizePositiveNumber(
    options.maxDeltaTimeSeconds,
    DEFAULT_MAX_DELTA_TIME_SECONDS,
  );

  const fpsSampleIntervalMs = normalizePositiveNumber(
    options.fpsSampleIntervalMs,
    DEFAULT_FPS_SAMPLE_INTERVAL_MS,
  );

  let running = false;
  let frameId: number | null = null;
  let previousTimestampMs: number | null = null;

  let fpsWindowStartMs: number | null = null;
  let fpsFrameCount = 0;

  function resetTiming(): void {
    previousTimestampMs = null;
    fpsWindowStartMs = null;
    fpsFrameCount = 0;
  }

  function updateFps(timestampMs: number, onFps?: (fps: number) => void): void {
    if (!Number.isFinite(timestampMs)) {
      return;
    }

    if (fpsWindowStartMs === null) {
      fpsWindowStartMs = timestampMs;
      fpsFrameCount = 0;
    }

    fpsFrameCount += 1;

    const elapsedMs = timestampMs - fpsWindowStartMs;

    if (elapsedMs < fpsSampleIntervalMs) {
      return;
    }

    const fps = Math.round((fpsFrameCount * 1000) / elapsedMs);

    onFps?.(fps);

    fpsWindowStartMs = timestampMs;
    fpsFrameCount = 0;
  }

  function scheduleNextFrame(callbacks: GameLoopCallbacks): void {
    frameId = scheduler.requestFrame((timestampMs) => {
      if (!running) {
        return;
      }

      const deltaTimeSeconds = calculateDeltaTimeSeconds(
        previousTimestampMs,
        timestampMs,
        maxDeltaTimeSeconds,
      );

      previousTimestampMs = Number.isFinite(timestampMs) ? timestampMs : null;

      const tick: GameLoopTick = {
        timestampMs,
        deltaTimeSeconds,
      };

      callbacks.update(tick);
      callbacks.render(tick);
      updateFps(timestampMs, callbacks.onFps);

      if (running) {
        scheduleNextFrame(callbacks);
      }
    });
  }

  function start(callbacks: GameLoopCallbacks): void {
    if (running) {
      return;
    }

    running = true;
    resetTiming();
    scheduleNextFrame(callbacks);
  }

  function stop(): void {
    if (!running && frameId === null) {
      return;
    }

    running = false;

    if (frameId !== null) {
      scheduler.cancelFrame(frameId);
      frameId = null;
    }

    resetTiming();
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
