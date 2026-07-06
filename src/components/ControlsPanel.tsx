/**
 * ControlsPanel component.
 *
 * Theme:
 * Tesla FSD + NASA Mission Control Hybrid
 */

import type { CameraMode } from "../simulation/camera";
import type { SensorConfig } from "../simulation/sensors/sensorModel";
import { SENSOR_CONFIG_LIMITS } from "../simulation/sensors/sensorConfiguration";
import type { SimulationStatus } from "../store";

export interface ControlsPanelProps {
  status: SimulationStatus;
  cameraMode: CameraMode;
  onStart?: () => void;
  onPause?: () => void;
  onReset?: () => void;
  onToggleCameraMode?: () => void;
  sensorConfig: SensorConfig;
  isDebugModeEnabled: boolean;
  areSensorsVisible: boolean;
  onToggleDebugMode?: () => void;
  onToggleSensorsVisibility?: () => void;
  onToggleSensorsEnabled?: () => void;
  onIncreaseSensorRayCount?: () => void;
  onDecreaseSensorRayCount?: () => void;
  onIncreaseSensorRange?: () => void;
  onDecreaseSensorRange?: () => void;
  onResetSensorSettings?: () => void;
}

export function ControlsPanel({
  status,
  cameraMode,
  onStart,
  onPause,
  onReset,
  onToggleCameraMode,
  sensorConfig,
  isDebugModeEnabled,
  areSensorsVisible,
  onToggleDebugMode,
  onToggleSensorsVisibility,
  onToggleSensorsEnabled,
  onIncreaseSensorRayCount,
  onDecreaseSensorRayCount,
  onIncreaseSensorRange,
  onDecreaseSensorRange,
  onResetSensorSettings,
}: ControlsPanelProps) {
  const isRunning = status === "running";

  const canDecreaseRayCount = sensorConfig.rayCount > SENSOR_CONFIG_LIMITS.minRayCount;

  const canIncreaseRayCount = sensorConfig.rayCount < SENSOR_CONFIG_LIMITS.maxRayCount;

  const canDecreaseRange = sensorConfig.rayLength > SENSOR_CONFIG_LIMITS.minRayLength;

  const canIncreaseRange = sensorConfig.rayLength < SENSOR_CONFIG_LIMITS.maxRayLength;

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

        <div className="mt-5 border-t border-sky-300/10 pt-4">
          <p className="mission-accent text-xs font-black uppercase tracking-[0.25em]">
            Sensor Controls
          </p>

          <div className="mt-4 grid gap-4">
            {/* Sensor enabled toggle */}
            <button
              type="button"
              aria-pressed={sensorConfig.sensorEnabled}
              className={[
                "w-full rounded-lg border px-4 py-3 text-sm font-black transition",
                sensorConfig.sensorEnabled
                  ? "border-emerald-300/40 bg-emerald-950/30 text-emerald-200 hover:border-emerald-300/70"
                  : "border-slate-500/40 bg-slate-950/50 text-slate-300 hover:border-slate-400/60",
              ].join(" ")}
              onClick={onToggleSensorsEnabled}
            >
              Sensors: {sensorConfig.sensorEnabled ? "Enabled" : "Disabled"}
            </button>

            {/* Debug mode toggle */}
            <button
              type="button"
              aria-pressed={isDebugModeEnabled}
              className={[
                "w-full rounded-lg border px-4 py-3 text-sm font-black transition",
                isDebugModeEnabled
                  ? "border-amber-300/50 bg-amber-950/30 text-amber-200 hover:border-amber-300/70"
                  : "border-sky-300/20 bg-slate-950/40 text-slate-300 hover:border-sky-300/50",
              ].join(" ")}
              onClick={onToggleDebugMode}
            >
              Debug Mode: {isDebugModeEnabled ? "Shown" : "Hidden"}
            </button>

            {/* Sensor overlay visibility */}
            <button
              type="button"
              aria-pressed={areSensorsVisible}
              className={[
                "w-full rounded-lg border px-4 py-3 text-sm font-black transition",
                areSensorsVisible
                  ? "border-cyan-300/40 bg-cyan-950/30 text-cyan-200 hover:border-cyan-300/70"
                  : "border-slate-500/40 bg-slate-950/50 text-slate-300 hover:border-slate-400/60",
              ].join(" ")}
              onClick={onToggleSensorsVisibility}
            >
              Sensor Overlay: {areSensorsVisible ? "Shown" : "Hidden"}
            </button>

            {/* Ray count control */}
            <div className="rounded-xl border border-sky-300/15 bg-slate-950/40 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-300">
                    Ray Count
                  </p>

                  <p
                    data-testid="sensor-ray-count"
                    className="mt-1 text-2xl font-black text-slate-50"
                  >
                    {sensorConfig.rayCount}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    aria-label="Decrease sensor ray count"
                    disabled={!canDecreaseRayCount}
                    className="min-w-12 rounded-lg border border-sky-300/30 bg-slate-950/60 px-3 py-2 font-black text-sky-200 transition hover:border-sky-300/60 hover:bg-sky-300/10 disabled:cursor-not-allowed disabled:opacity-30"
                    onClick={onDecreaseSensorRayCount}
                  >
                    −2
                  </button>

                  <button
                    type="button"
                    aria-label="Increase sensor ray count"
                    disabled={!canIncreaseRayCount}
                    className="min-w-12 rounded-lg border border-sky-300/30 bg-slate-950/60 px-3 py-2 font-black text-sky-200 transition hover:border-sky-300/60 hover:bg-sky-300/10 disabled:cursor-not-allowed disabled:opacity-30"
                    onClick={onIncreaseSensorRayCount}
                  >
                    +2
                  </button>
                </div>
              </div>

              <p className="mt-2 text-xs text-slate-500">
                Allowed range: {SENSOR_CONFIG_LIMITS.minRayCount}–
                {SENSOR_CONFIG_LIMITS.maxRayCount}
              </p>
            </div>

            {/* Sensor range control */}
            <div className="rounded-xl border border-sky-300/15 bg-slate-950/40 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-300">
                    Sensor Range
                  </p>

                  <p
                    data-testid="sensor-range"
                    className="mt-1 text-2xl font-black text-slate-50"
                  >
                    {sensorConfig.rayLength}
                    <span className="ml-1 text-xs font-bold text-slate-400">units</span>
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    aria-label="Decrease sensor range"
                    disabled={!canDecreaseRange}
                    className="min-w-12 rounded-lg border border-sky-300/30 bg-slate-950/60 px-3 py-2 font-black text-sky-200 transition hover:border-sky-300/60 hover:bg-sky-300/10 disabled:cursor-not-allowed disabled:opacity-30"
                    onClick={onDecreaseSensorRange}
                  >
                    −25
                  </button>

                  <button
                    type="button"
                    aria-label="Increase sensor range"
                    disabled={!canIncreaseRange}
                    className="min-w-12 rounded-lg border border-sky-300/30 bg-slate-950/60 px-3 py-2 font-black text-sky-200 transition hover:border-sky-300/60 hover:bg-sky-300/10 disabled:cursor-not-allowed disabled:opacity-30"
                    onClick={onIncreaseSensorRange}
                  >
                    +25
                  </button>
                </div>
              </div>

              <p className="mt-2 text-xs text-slate-500">
                Allowed range: {SENSOR_CONFIG_LIMITS.minRayLength}–
                {SENSOR_CONFIG_LIMITS.maxRayLength} units
              </p>
            </div>

            {/* Reset */}
            <button
              type="button"
              className="w-full rounded-lg border border-red-300/30 bg-red-950/20 px-4 py-3 text-sm font-black text-red-200 transition hover:border-red-300/60 hover:bg-red-950/40"
              onClick={onResetSensorSettings}
            >
              Reset Sensor Settings
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
