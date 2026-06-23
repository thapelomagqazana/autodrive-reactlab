/**
 * Root composition for AutoDrive ReactLab.
 */

import { AppShell } from "./app";
import { ControlsPanel, Header, SimulationCanvas } from "./components";
import {
  usePauseSimulation,
  useResetSimulation,
  useSimulationStatus,
  useSimulationTelemetry,
  useStartSimulation,
} from "./store";

export function App() {
  const status = useSimulationStatus();
  const telemetry = useSimulationTelemetry();

  const startSimulation = useStartSimulation();
  const pauseSimulation = usePauseSimulation();
  const resetSimulation = useResetSimulation();

  return (
    <AppShell
      header={<Header />}
      simulation={<SimulationCanvas />}
      controls={
        <ControlsPanel
          onStart={startSimulation}
          onPause={pauseSimulation}
          onReset={resetSimulation}
          onToggleSensors={() => undefined}
          onToggleDebugMode={() => undefined}
          onSelectScenario={() => undefined}
          selectedScenarioLabel="Foundation preview"
        />
      }
      dashboard={
        <div className="arcade-panel p-5">
          <div className="relative z-10">
            <h2 className="arcade-accent text-lg font-black uppercase tracking-[0.2em]">
              Simulation State
            </h2>

            <dl className="mt-4 grid gap-4">
              <div className="arcade-metric p-4">
                <dt className="text-sm text-violet-100/70">Status</dt>
                <dd className="text-2xl font-black capitalize text-cyan-300">
                  {status}
                </dd>
              </div>

              <div className="arcade-metric p-4">
                <dt className="text-sm text-violet-100/70">Elapsed Time</dt>
                <dd className="text-2xl font-black text-cyan-300">
                  {telemetry.elapsedTimeSeconds}s
                </dd>
              </div>

              <div className="arcade-metric p-4">
                <dt className="text-sm text-violet-100/70">FPS</dt>
                <dd className="text-2xl font-black text-cyan-300">
                  {telemetry.fps}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      }
    />
  );
}

export default App;