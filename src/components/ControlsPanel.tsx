/**
 * ControlsPanel component.
 *
 * Presentational control surface for AutoDrive ReactLab.
 *
 * Responsibilities:
 * - Render lifecycle controls.
 * - Apply lifecycle-based disabled rules.
 * - Expose accessible buttons.
 * - Call provided event handlers.
 *
 * Non-responsibilities:
 * - No Zustand imports.
 * - No game loop imports.
 * - No requestAnimationFrame usage.
 * - No simulation physics.
 */

import type { SimulationStatus } from "../store";

export interface ControlsPanelProps {
  status: SimulationStatus;
  onStart?: () => void;
  onPause?: () => void;
  onReset?: () => void;
}

export function ControlsPanel({
  status,
  onStart,
  onPause,
  onReset,
}: ControlsPanelProps) {
  const isRunning = status === "running";

  return (
    <section aria-labelledby="controls-panel-title" className="arcade-panel p-5">
      <div className="relative z-10">
        <p className="arcade-accent text-xs font-black uppercase tracking-[0.25em]">
          Driver Console
        </p>

        <h2 id="controls-panel-title" className="mt-1 text-lg font-black text-white">
          Controls
        </h2>

        <div className="mt-5 grid gap-3">
          <button
            type="button"
            className="arcade-button rounded-lg px-4 py-2 font-black disabled:cursor-not-allowed disabled:opacity-45"
            disabled={isRunning}
            onClick={onStart}
          >
            Start
          </button>

          <button
            type="button"
            className="arcade-button rounded-lg px-4 py-2 font-black disabled:cursor-not-allowed disabled:opacity-45"
            disabled={!isRunning}
            onClick={onPause}
          >
            Pause
          </button>

          <button
            type="button"
            className="rounded-lg border border-cyan-300/30 px-4 py-2 font-black text-cyan-200 hover:bg-cyan-300/10"
            onClick={onReset}
          >
            Reset
          </button>
        </div>
      </div>
    </section>
  );
}