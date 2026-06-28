/**
 * ControlsPanel component.
 *
 * Theme:
 * Tesla FSD + NASA Mission Control Hybrid
 */

import type { CameraMode } from "../simulation/camera";
import type { SimulationStatus } from "../store";

export interface ControlsPanelProps {
  status: SimulationStatus;
  cameraMode: CameraMode;
  onStart?: () => void;
  onPause?: () => void;
  onReset?: () => void;
  onToggleCameraMode?: () => void;
}

export function ControlsPanel({
  status,
  cameraMode,
  onStart,
  onPause,
  onReset,
  onToggleCameraMode,
}: ControlsPanelProps) {
  const isRunning = status === "running";

  return (
    <section aria-labelledby="controls-panel-title" className="mission-panel p-5">
      <div className="relative z-10">
        <p className="mission-accent text-xs font-black uppercase tracking-[0.25em]">
          Driver Console
        </p>

        <h2 id="controls-panel-title" className="mt-1 text-lg font-black text-slate-50">
          Controls
        </h2>

        <div className="mt-5 grid gap-3">
          <button
            type="button"
            className="mission-button rounded-lg px-4 py-2 font-black disabled:cursor-not-allowed disabled:opacity-45"
            disabled={isRunning}
            onClick={onStart}
          >
            Start
          </button>

          <button
            type="button"
            className="mission-button rounded-lg px-4 py-2 font-black disabled:cursor-not-allowed disabled:opacity-45"
            disabled={!isRunning}
            onClick={onPause}
          >
            Pause
          </button>

          <button
            type="button"
            className="rounded-lg border border-sky-300/30 bg-slate-950/40 px-4 py-2 font-black text-sky-200 transition hover:border-sky-300/60 hover:bg-sky-300/10 hover:text-sky-100"
            onClick={onReset}
          >
            Reset
          </button>
        </div>

        <div className="mt-5 border-t border-sky-300/10 pt-4">
          <p className="mission-accent text-xs font-black uppercase tracking-[0.25em]">
            Camera Debug
          </p>

          <button
            type="button"
            className="mt-3 w-full rounded-lg border border-sky-300/30 bg-slate-950/40 px-4 py-2 font-black text-sky-200 transition hover:border-sky-300/60 hover:bg-sky-300/10 hover:text-sky-100"
            onClick={onToggleCameraMode}
          >
            Camera: {cameraMode === "fixed" ? "Fixed" : "Follow"}
          </button>
        </div>
      </div>
    </section>
  );
}
