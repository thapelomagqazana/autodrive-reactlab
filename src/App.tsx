/**
 * Temporary root composition for AutoDrive ReactLab.
 *
 * This wires the application through AppShell while later phases introduce
 * dedicated Header, SimulationCanvas, ControlsPanel, and DashboardPanel components.
 */

import { AppShell } from "./app";
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
      header={
        <div className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-6 shadow-2xl shadow-sky-950/30 backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-300">
            AutoDrive ReactLab
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-5xl">
            AutoDrive ReactLab
          </h1>

          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
            Global simulation state is now available for controls, telemetry,
            dashboard panels, and future engine integration.
          </p>
        </div>
      }
      simulation={
        <div className="flex min-h-[28rem] items-center justify-center rounded-xl border border-slate-700 bg-slate-950/70">
          <p className="text-sm text-slate-400">Simulation canvas area</p>
        </div>
      }
      controls={
        <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-5">
          <h2 className="text-lg font-semibold text-white">Controls</h2>

          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={startSimulation}>
              Start
            </button>
            <button type="button" onClick={pauseSimulation}>
              Pause
            </button>
            <button type="button" onClick={resetSimulation}>
              Reset
            </button>
            <button type="button" onClick={() => setFps(60)}>
              Set FPS 60
            </button>
          </div>
        </div>
      }
      dashboard={
        <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-5">
          <h2 className="text-lg font-semibold text-white">Simulation State</h2>

          <dl className="mt-4 grid gap-4">
            <div>
              <dt className="text-sm text-slate-400">Status</dt>
              <dd className="text-2xl font-bold capitalize text-sky-300">{status}</dd>
            </div>

            <div>
              <dt className="text-sm text-slate-400">Elapsed Time</dt>
              <dd className="text-2xl font-bold text-sky-300">
                {telemetry.elapsedTimeSeconds}s
              </dd>
            </div>

            <div>
              <dt className="text-sm text-slate-400">FPS</dt>
              <dd className="text-2xl font-bold text-sky-300">{telemetry.fps}</dd>
            </div>
          </dl>
        </div>
      }
    />
  );
}

export default App;