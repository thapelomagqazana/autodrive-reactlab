/**
 * ControlsPanel component.
 *
 * Responsibility:
 * - Display the initial user control surface for AutoDrive ReactLab.
 * - Expose accessible controls through a clear props contract.
 *
 * Non-responsibility:
 * - No game loop logic.
 * - No physics logic.
 * - No canvas mutation.
 * - No direct Zustand dependency.
 */

export interface ControlsPanelProps {
  onStart?: () => void;
  onPause?: () => void;
  onReset?: () => void;
  onToggleSensors?: () => void;
  onToggleDebugMode?: () => void;
  onSelectScenario?: () => void;
  isSensorsVisible?: boolean;
  isDebugModeEnabled?: boolean;
  selectedScenarioLabel?: string;
}

const noop = () => undefined;

export function ControlsPanel({
  onStart = noop,
  onPause = noop,
  onReset = noop,
  onToggleSensors = noop,
  onToggleDebugMode = noop,
  onSelectScenario = noop,
  isSensorsVisible = true,
  isDebugModeEnabled = false,
  selectedScenarioLabel = "Scenario selector pending",
}: ControlsPanelProps) {
  return (
    <section className="arcade-panel p-5" aria-labelledby="controls-panel-title">
      <div className="relative z-10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="arcade-accent text-xs font-black uppercase tracking-[0.25em]">
              Driver Console
            </p>

            <h2
              id="controls-panel-title"
              className="mt-1 text-lg font-black text-white"
            >
              Controls
            </h2>
          </div>

          <span className="arcade-badge rounded-full px-3 py-1 text-xs font-black">
            Manual
          </span>
        </div>

        <div className="mt-5 grid gap-3">
          <button
            className="arcade-button rounded-lg px-4 py-2 font-black"
            type="button"
            onClick={onStart}
          >
            Start
          </button>

          <button
            className="arcade-button rounded-lg px-4 py-2 font-black"
            type="button"
            onClick={onPause}
          >
            Pause
          </button>

          <button
            className="arcade-button rounded-lg px-4 py-2 font-black"
            type="button"
            onClick={onReset}
          >
            Reset
          </button>

          <button
            className="rounded-lg border border-cyan-300/30 px-4 py-2 font-black text-cyan-200 hover:bg-cyan-300/10"
            type="button"
            aria-pressed={isSensorsVisible}
            onClick={onToggleSensors}
          >
            Sensors: {isSensorsVisible ? "On" : "Off"}
          </button>

          <button
            className="rounded-lg border border-cyan-300/30 px-4 py-2 font-black text-cyan-200 hover:bg-cyan-300/10"
            type="button"
            aria-pressed={isDebugModeEnabled}
            onClick={onToggleDebugMode}
          >
            Debug: {isDebugModeEnabled ? "On" : "Off"}
          </button>

          <button
            className="rounded-lg border border-violet-200/25 px-4 py-2 text-left text-sm font-bold text-violet-100/80 hover:bg-violet-300/10"
            type="button"
            onClick={onSelectScenario}
          >
            Scenario: {selectedScenarioLabel}
          </button>
        </div>
      </div>
    </section>
  );
}