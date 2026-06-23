/**
 * Temporary root component used to verify Tailwind and Zustand integration.
 *
 * Later phases will replace this with:
 * - AppShell
 * - SimulationCanvas
 * - ControlsPanel
 * - DashboardPanel
 */

import {
  useSimulationActions,
  useSimulationStatus,
  useSimulationTelemetry,
} from "./store";

export function App() {
  const status = useSimulationStatus();
  const telemetry = useSimulationTelemetry();
  const { startSimulation, pauseSimulation, resetSimulation, setFps } =
    useSimulationActions();

  return (
    <main className="min-h-screen px-6 py-8 text-slate-100">
      <section className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-6 shadow-2xl shadow-sky-950/30 backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-300">
            AutoDrive ReactLab
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-5xl">
            Zustand Store Configured
          </h1>

          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
            Global simulation state is now available for controls, telemetry,
            dashboard panels, and future engine integration.
          </p>
        </header>

        <section className="rounded-xl border border-slate-700 bg-slate-900/80 p-5">
          <h2 className="text-lg font-semibold text-white">Simulation State</h2>

          <dl className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-4">
              <dt className="text-sm text-slate-400">Status</dt>
              <dd className="mt-1 text-2xl font-bold capitalize text-sky-300">
                {status}
              </dd>
            </div>

            <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-4">
              <dt className="text-sm text-slate-400">Elapsed Time</dt>
              <dd className="mt-1 text-2xl font-bold text-sky-300">
                {telemetry.elapsedTimeSeconds}s
              </dd>
            </div>

            <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-4">
              <dt className="text-sm text-slate-400">FPS</dt>
              <dd className="mt-1 text-2xl font-bold text-sky-300">
                {telemetry.fps}
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-emerald-950 hover:bg-emerald-400"
              type="button"
              onClick={startSimulation}
            >
              Start
            </button>

            <button
              className="rounded-lg bg-amber-400 px-4 py-2 font-semibold text-amber-950 hover:bg-amber-300"
              type="button"
              onClick={pauseSimulation}
            >
              Pause
            </button>

            <button
              className="rounded-lg bg-rose-500 px-4 py-2 font-semibold text-white hover:bg-rose-400"
              type="button"
              onClick={resetSimulation}
            >
              Reset
            </button>

            <button
              className="rounded-lg border border-slate-600 px-4 py-2 font-semibold text-slate-200 hover:bg-slate-800"
              type="button"
              onClick={() => setFps(60)}
            >
              Set FPS 60
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}

export default App;