/**
 * Root composition for AutoDrive ReactLab.
 */

import { AppShell } from "./app";
import { Header, SimulationCanvas } from "./components";
import {
  usePauseSimulation,
  useResetSimulation,
  useSetFps,
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
  const setFps = useSetFps();

  return (
    <AppShell
      header={<Header />}
      simulation={<SimulationCanvas />}
      controls={
        <div className="arcade-panel p-5">
          <div className="relative z-10">
            <h2 className="arcade-accent text-lg font-black uppercase tracking-[0.2em]">
              Controls
            </h2>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                className="arcade-button rounded-lg px-4 py-2 font-black"
                type="button"
                onClick={startSimulation}
              >
                Start
              </button>

              <button
                className="arcade-button rounded-lg px-4 py-2 font-black"
                type="button"
                onClick={pauseSimulation}
              >
                Pause
              </button>

              <button
                className="arcade-button rounded-lg px-4 py-2 font-black"
                type="button"
                onClick={resetSimulation}
              >
                Reset
              </button>

              <button
                className="rounded-lg border border-cyan-300/30 px-4 py-2 font-black text-cyan-200 hover:bg-cyan-300/10"
                type="button"
                onClick={() => setFps(60)}
              >
                Set FPS 60
              </button>
            </div>
          </div>
        </div>
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