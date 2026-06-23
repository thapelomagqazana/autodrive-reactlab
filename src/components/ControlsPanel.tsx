/**
 * ControlsPanel component.
 *
 * Displays simulator controls grouped by user intent:
 * - Simulation lifecycle
 * - Visualization options
 * - Scenario selection
 *
 * This component emits intent through props.
 * It does not own simulation engine logic.
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
  selectedScenarioLabel = "Foundation preview",
}: ControlsPanelProps) {
  return (
    <section className="arcade-panel p-5" aria-labelledby="controls-panel-title">
      <div className="relative z-10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="arcade-accent text-xs font-black uppercase tracking-[0.25em]">
              Driver Console
            </p>

            <h2 id="controls-panel-title" className="mt-1 text-lg font-black text-white">
              Controls
            </h2>
          </div>

          <span className="arcade-badge rounded-full px-3 py-1 text-xs font-black">
            Manual
          </span>
        </div>

        <div className="mt-5 space-y-5">
          <section aria-labelledby="simulation-controls-title">
            <h3
              id="simulation-controls-title"
              className="text-xs font-black uppercase tracking-[0.22em] text-violet-100/70"
            >
              Simulation
            </h3>

            <div className="mt-3 grid gap-3">
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
            </div>
          </section>

          <div className="h-px bg-cyan-300/20" />

          <section aria-labelledby="visualization-controls-title">
            <h3
              id="visualization-controls-title"
              className="text-xs font-black uppercase tracking-[0.22em] text-violet-100/70"
            >
              Visualization
            </h3>

            <div className="mt-3 grid gap-3">
              <button
                className="flex items-center justify-between rounded-lg border border-cyan-300/30 px-4 py-2 font-black text-cyan-200 hover:bg-cyan-300/10"
                type="button"
                aria-label={`Sensors: ${isSensorsVisible ? "On" : "Off"}`}
                aria-pressed={isSensorsVisible}
                onClick={onToggleSensors}
              >
                <span aria-hidden="true">Sensors</span>
                <span aria-hidden="true">{isSensorsVisible ? "On" : "Off"}</span>
              </button>

              <button
                className="flex items-center justify-between rounded-lg border border-cyan-300/30 px-4 py-2 font-black text-cyan-200 hover:bg-cyan-300/10"
                type="button"
                aria-label={`Debug: ${isDebugModeEnabled ? "On" : "Off"}`}
                aria-pressed={isDebugModeEnabled}
                onClick={onToggleDebugMode}
              >
                <span aria-hidden="true">Debug</span>
                <span aria-hidden="true">{isDebugModeEnabled ? "On" : "Off"}</span>
              </button>
            </div>
          </section>

          <div className="h-px bg-cyan-300/20" />

          <section aria-labelledby="scenario-controls-title">
            <h3
              id="scenario-controls-title"
              className="text-xs font-black uppercase tracking-[0.22em] text-violet-100/70"
            >
              Scenario
            </h3>

            <button
              className="mt-3 flex w-full items-center justify-between rounded-lg border border-violet-200/25 px-4 py-2 text-left text-sm font-bold text-violet-100/80 hover:bg-violet-300/10"
              type="button"
              onClick={onSelectScenario}
            >
              <span>{selectedScenarioLabel}</span>
              <span aria-hidden="true">▼</span>
            </button>
          </section>
        </div>
      </div>
    </section>
  );
}