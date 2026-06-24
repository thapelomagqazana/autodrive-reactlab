/**
 * DashboardPanel component.
 *
 * Read-only dashboard for simulation status, elapsed simulation time,
 * sampled FPS telemetry, and optional canvas diagnostics.
 *
 * Responsibilities:
 * - Display lifecycle status.
 * - Display formatted simulation time.
 * - Display sampled FPS.
 * - Display optional canvas diagnostics.
 *
 * Non-responsibilities:
 * - No store mutation.
 * - No game loop logic.
 * - No FPS calculation.
 * - No canvas mutation.
 */

import type { SimulationStatus } from "../store";
import type { CanvasDiagnostics } from "../types/canvasDiagnostics";
import { formatCanvasResolution } from "../utils/formatCanvasResolution";
import { formatElapsedTime } from "../utils/formatElapsedTime";
import { formatFps } from "../utils/formatFps";
import { TelemetryCard } from "./TelemetryCard";
import { DEFAULT_VEHICLE_TELEMETRY_PLACEHOLDERS } from "./vehicleTelemetryPlaceholders";

export interface DashboardPanelProps {
  status: SimulationStatus;
  simulationTimeSeconds: number;
  fps: number;
  canvasDiagnostics?: CanvasDiagnostics;
}

function getStatusPresentation(status: SimulationStatus) {
  switch (status) {
    case "running":
      return {
        label: "Running",
        dotClassName: "bg-emerald-400",
        textClassName: "text-emerald-300",
      };

    case "paused":
      return {
        label: "Paused",
        dotClassName: "bg-amber-400",
        textClassName: "text-amber-300",
      };

    case "idle":
    default:
      return {
        label: "Idle",
        dotClassName: "bg-slate-400",
        textClassName: "text-slate-300",
      };
  }
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-xl border border-cyan-300/20 bg-black/40 p-4">
      <dt className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
        {label}
      </dt>

      <dd className="mt-2 text-2xl font-black text-white">{value}</dd>
    </article>
  );
}

export function DashboardPanel({
  status,
  simulationTimeSeconds,
  fps,
  canvasDiagnostics,
}: DashboardPanelProps) {
  const statusPresentation = getStatusPresentation(status);

  return (
    <section aria-labelledby="dashboard-panel-title" className="arcade-panel p-5">
      <div className="relative z-10">
        <p className="arcade-accent text-xs font-black uppercase tracking-[0.25em]">
          Telemetry Deck
        </p>

        <h2 id="dashboard-panel-title" className="mt-1 text-lg font-black text-white">
          Dashboard
        </h2>

        <div
          aria-live="polite"
          aria-label={`Simulation status: ${statusPresentation.label}`}
          className="mt-4 flex items-center gap-2 rounded-xl border border-cyan-300/20 bg-black/40 px-4 py-3"
        >
          <span
            aria-hidden="true"
            className={`h-3 w-3 rounded-full ${statusPresentation.dotClassName}`}
          />

          <span className={`font-black ${statusPresentation.textClassName}`}>
            {statusPresentation.label}
          </span>
        </div>

        <dl className="mt-4 grid gap-3">
          <MetricCard
            label="Elapsed Time"
            value={formatElapsedTime(simulationTimeSeconds)}
          />

          <MetricCard label="FPS" value={formatFps(fps)} />
        </dl>

        {canvasDiagnostics ? (
          <section aria-label="Canvas Diagnostics" className="mt-5">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-violet-100/70">
              Canvas Diagnostics
            </h3>

            <dl className="mt-3 grid gap-2 text-sm text-violet-100/80">
              <div className="flex justify-between gap-3">
                <dt>Width</dt>
                <dd>{Math.round(canvasDiagnostics.width)}px</dd>
              </div>

              <div className="flex justify-between gap-3">
                <dt>Height</dt>
                <dd>{Math.round(canvasDiagnostics.height)}px</dd>
              </div>

              <div className="flex justify-between gap-3">
                <dt>DPR</dt>
                <dd>{canvasDiagnostics.pixelRatio}</dd>
              </div>

              <div className="flex justify-between gap-3">
                <dt>Logical</dt>
                <dd>
                  {formatCanvasResolution(
                    canvasDiagnostics.width,
                    canvasDiagnostics.height,
                  )}
                </dd>
              </div>

              <div className="flex justify-between gap-3">
                <dt>Buffer</dt>
                <dd>
                  {formatCanvasResolution(
                    canvasDiagnostics.bufferWidth,
                    canvasDiagnostics.bufferHeight,
                  )}
                </dd>
              </div>
            </dl>
          </section>
        ) : null}
        <section aria-label="Vehicle Telemetry" className="mt-5">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-violet-100/70">
            Vehicle Telemetry
          </h3>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TelemetryCard
              label="Vehicle Speed"
              value={DEFAULT_VEHICLE_TELEMETRY_PLACEHOLDERS.speed}
              isPlaceholder
            />

            <TelemetryCard
              label="Acceleration"
              value={DEFAULT_VEHICLE_TELEMETRY_PLACEHOLDERS.acceleration}
              isPlaceholder
            />

            <TelemetryCard
              label="Steering Angle"
              value={DEFAULT_VEHICLE_TELEMETRY_PLACEHOLDERS.steeringAngle}
              isPlaceholder
            />

            <TelemetryCard
              label="Heading"
              value={DEFAULT_VEHICLE_TELEMETRY_PLACEHOLDERS.heading}
              isPlaceholder
            />

            <TelemetryCard
              label="AI Decision"
              value={DEFAULT_VEHICLE_TELEMETRY_PLACEHOLDERS.aiDecision}
              isPlaceholder
            />

            <TelemetryCard
              label="Collision Count"
              value={DEFAULT_VEHICLE_TELEMETRY_PLACEHOLDERS.collisionCount}
              isPlaceholder
            />

            <TelemetryCard
              label="Sensor Status"
              value={DEFAULT_VEHICLE_TELEMETRY_PLACEHOLDERS.sensorStatus}
              isPlaceholder
            />

            <TelemetryCard
              label="Destination Status"
              value={DEFAULT_VEHICLE_TELEMETRY_PLACEHOLDERS.destinationStatus}
              isPlaceholder
            />
          </div>
        </section>
      </div>
    </section>
  );
}
