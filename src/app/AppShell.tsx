/**
 * AppShell
 *
 * Defines the top-level application frame for AutoDrive ReactLab.
 *
 * Layout goal:
 * - Make the simulation canvas the hero region.
 * - Keep controls/dashboard available but visually secondary.
 * - Prevent horizontal overflow as the canvas grows.
 */

import type { ReactNode } from "react";

export interface AppShellProps {
  header: ReactNode;
  simulation: ReactNode;
  controls: ReactNode;
  dashboard: ReactNode;
}

export function AppShell({ header, simulation, controls, dashboard }: AppShellProps) {
  return (
    <main className="min-h-screen px-4 py-6 text-white md:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[96rem] flex-col gap-6">
        <header aria-label="Application header">{header}</header>

        <section
          aria-label="Simulation workspace"
          className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_22rem]"
        >
          <section aria-label="Simulation canvas area" className="min-w-0">
            {simulation}
          </section>

          <aside
            aria-label="Simulation side panel"
            className="flex min-w-0 flex-col gap-6"
          >
            <section aria-label="Simulation controls">{controls}</section>
            <section aria-label="Simulation dashboard">{dashboard}</section>
          </aside>
        </section>
      </div>
    </main>
  );
}
