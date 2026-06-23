/**
 * AppShell
 *
 * Defines the top-level application frame for AutoDrive ReactLab.
 *
 * Responsibility:
 * - Own page-level layout only.
 * - Provide clear semantic regions for header, simulation, controls, and dashboard.
 * - Prevent layout overflow as the simulator canvas grows.
 *
 * Non-responsibility:
 * - No simulation engine logic.
 * - No canvas drawing.
 * - No Zustand mutation.
 * - No AI, physics, or telemetry calculations.
 */

import type { ReactNode } from "react";

export interface AppShellProps {
  /**
   * Application identity region.
   *
   * Expected child:
   * - Header
   */
  header: ReactNode;

  /**
   * Main simulation rendering region.
   *
   * Expected child:
   * - SimulationCanvas
   */
  simulation: ReactNode;

  /**
   * User interaction region.
   *
   * Expected child:
   * - ControlsPanel
   */
  controls: ReactNode;

  /**
   * Telemetry display region.
   *
   * Expected child:
   * - DashboardPanel
   */
  dashboard: ReactNode;
}

export function AppShell({
  header,
  simulation,
  controls,
  dashboard,
}: AppShellProps) {
  return (
    <main className="min-h-screen px-4 py-6 text-white md:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header aria-label="Application header">{header}</header>

        <section
          aria-label="Simulation workspace"
          className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]"
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