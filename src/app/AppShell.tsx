/**
 * AppShell
 *
 * Defines the top-level application frame for AutoDrive ReactLab.
 *
 * Responsibility:
 * - Own page-level layout only.
 * - Provide clear semantic regions for header, simulation, controls, and dashboard.
 *
 * Non-responsibility:
 * - No simulation engine logic.
 * - No canvas drawing.
 * - No Zustand mutation.
 * - No AI, physics, or telemetry calculations.
 */

import type { ReactNode } from "react";

export interface AppShellProps {
  header: ReactNode;
  simulation: ReactNode;
  controls: ReactNode;
  dashboard: ReactNode;
}

export function AppShell({
  header,
  simulation,
  controls,
  dashboard,
}: AppShellProps) {
  return (
    <main className="min-h-screen px-6 py-8 text-slate-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header aria-label="Application header">{header}</header>

        <section
          aria-label="Simulation workspace"
          className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]"
        >
          <section aria-label="Simulation canvas area">{simulation}</section>

          <aside aria-label="Simulation side panel" className="flex flex-col gap-6">
            <section aria-label="Simulation controls">{controls}</section>
            <section aria-label="Simulation dashboard">{dashboard}</section>
          </aside>
        </section>
      </div>
    </main>
  );
}