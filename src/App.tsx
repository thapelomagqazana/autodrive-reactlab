/**
 * Root application component for AutoDrive ReactLab.
 *
 * Purpose in WBS 0.2.1:
 * - Prove Tailwind CSS utilities render correctly.
 * - Provide a temporary professional project landing surface.
 * - Avoid deep simulation logic before the architecture phases are complete.
 *
 * This component is intentionally simple. Future phases will replace this
 * temporary layout with AppShell, SimulationCanvas, ControlsPanel, and
 * DashboardPanel components.
 */

export function App() {
  return (
    <main className="min-h-screen px-6 py-8 text-slate-100">
      <section className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-6 shadow-2xl shadow-sky-950/30 backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-300">
            AutoDrive ReactLab
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-5xl">
            React-Based Self-Driving Car Simulation
          </h1>

          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
            Tailwind CSS is configured and ready for the simulator layout,
            dashboard panels, controls, canvas shell, and responsive engineering UI.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-xl border border-slate-700 bg-slate-900/80 p-5">
            <h2 className="text-lg font-semibold text-white">Styling</h2>
            <p className="mt-2 text-sm text-slate-400">
              Utility classes are rendering correctly.
            </p>
          </article>

          <article className="rounded-xl border border-slate-700 bg-slate-900/80 p-5">
            <h2 className="text-lg font-semibold text-white">Build</h2>
            <p className="mt-2 text-sm text-slate-400">
              Tailwind is integrated through Vite.
            </p>
          </article>

          <article className="rounded-xl border border-slate-700 bg-slate-900/80 p-5">
            <h2 className="text-lg font-semibold text-white">Future UI</h2>
            <p className="mt-2 text-sm text-slate-400">
              Ready for dashboard, controls, and canvas components.
            </p>
          </article>
        </section>
      </section>
    </main>
  );
}

export default App;