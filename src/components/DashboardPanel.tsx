/**
 * DashboardPanel component.
 *
 * Theme:
 * Tesla FSD + NASA Mission Control Hybrid
 */

import type { SimulationStatus } from "../store";
import type { CanvasDiagnostics } from "../types/canvasDiagnostics";
import { formatCanvasResolution } from "../utils/formatCanvasResolution";
import { formatElapsedTime } from "../utils/formatElapsedTime";
import { formatFps } from "../utils/formatFps";
import { TelemetryCard } from "./TelemetryCard";
import { formatVehicleSpeed } from "./formatVehicleSpeed";
import { formatVehicleAcceleration } from "./formatVehicleAcceleration";
import { formatSteeringAngle } from "./formatSteeringAngle";
import { formatVehiclePosition } from "./formatVehiclePosition";
import { formatVehicleHeading } from "./formatVehicleHeading";
import { formatRoadDepartureWarning } from "./formatRoadDepartureWarning";
import { DEFAULT_VEHICLE_TELEMETRY_PLACEHOLDERS } from "./vehicleTelemetryPlaceholders";

export interface DashboardPanelProps {
  status: SimulationStatus;
  simulationTimeSeconds: number;
  fps: number;
  vehicleSpeed: number;
  vehicleAcceleration: number;
  steeringAngle: number;
  vehiclePositionX: number;
  vehiclePositionY: number;
  vehicleHeading: number;
  canvasDiagnostics?: CanvasDiagnostics;
  roadDepartureWarning: boolean;
}

function getStatusPresentation(status: SimulationStatus) {
  switch (status) {
    case "running":
      return {
        label: "Running",
        dotClassName: "bg-emerald-400 shadow-[0_0_14px_rgb(52_211_153_/_0.65)]",
        textClassName: "text-emerald-300",
      };

    case "paused":
      return {
        label: "Paused",
        dotClassName: "bg-amber-400 shadow-[0_0_14px_rgb(251_191_36_/_0.65)]",
        textClassName: "text-amber-300",
      };

    case "idle":
    default:
      return {
        label: "Idle",
        dotClassName: "bg-slate-400 shadow-[0_0_12px_rgb(148_163_184_/_0.45)]",
        textClassName: "text-slate-300",
      };
  }
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="mission-metric p-4">
      <dt className="text-xs font-black uppercase tracking-[0.2em] text-sky-300">
        {label}
      </dt>

      <dd className="mt-2 text-2xl font-black text-slate-50">{value}</dd>
    </article>
  );
}

export function DashboardPanel({
  status,
  simulationTimeSeconds,
  fps,
  vehicleSpeed,
  vehicleAcceleration,
  steeringAngle,
  vehiclePositionX,
  vehiclePositionY,
  vehicleHeading,
  canvasDiagnostics,
  roadDepartureWarning,
}: DashboardPanelProps) {
  const statusPresentation = getStatusPresentation(status);

  return (
    <section aria-labelledby="dashboard-panel-title" className="mission-panel p-5">
      <div className="relative z-10">
        <p className="mission-accent text-xs font-black uppercase tracking-[0.25em]">
          Mission Telemetry
        </p>

        <h2 id="dashboard-panel-title" className="mt-1 text-lg font-black text-slate-50">
          Dashboard
        </h2>

        <div
          aria-live="polite"
          aria-label={`Simulation status: ${statusPresentation.label}`}
          className="mission-metric mt-4 flex items-center gap-2 px-4 py-3"
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
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
              Canvas Diagnostics
            </h3>

            <dl className="mt-3 grid gap-2 text-sm text-slate-300">
              <div className="flex justify-between gap-3">
                <dt>Width</dt>
                <dd className="font-mono text-slate-100">
                  {Math.round(canvasDiagnostics.width)}px
                </dd>
              </div>

              <div className="flex justify-between gap-3">
                <dt>Height</dt>
                <dd className="font-mono text-slate-100">
                  {Math.round(canvasDiagnostics.height)}px
                </dd>
              </div>

              <div className="flex justify-between gap-3">
                <dt>DPR</dt>
                <dd className="font-mono text-slate-100">
                  {canvasDiagnostics.pixelRatio}
                </dd>
              </div>

              <div className="flex justify-between gap-3">
                <dt>Logical</dt>
                <dd className="font-mono text-slate-100">
                  {formatCanvasResolution(
                    canvasDiagnostics.width,
                    canvasDiagnostics.height,
                  )}
                </dd>
              </div>

              <div className="flex justify-between gap-3">
                <dt>Buffer</dt>
                <dd className="font-mono text-slate-100">
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
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
            Vehicle Telemetry
          </h3>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TelemetryCard
              testId="vehicle-speed-telemetry"
              label="Vehicle Speed"
              value={`${formatVehicleSpeed(vehicleSpeed)} px/s`}
            />

            <TelemetryCard
              testId="vehicle-acceleration-telemetry"
              label="Acceleration"
              value={`${formatVehicleAcceleration(vehicleAcceleration)} px/s²`}
            />

            <TelemetryCard
              testId="vehicle-steering-telemetry"
              label="Steering Angle"
              value={formatSteeringAngle(steeringAngle)}
            />

            <TelemetryCard
              testId="vehicle-position-telemetry"
              label="Position"
              value={formatVehiclePosition(vehiclePositionX, vehiclePositionY)}
            />

            <TelemetryCard
              testId="vehicle-heading-telemetry"
              label="Heading"
              value={formatVehicleHeading(vehicleHeading)}
            />

            <TelemetryCard
              testId="road-status-telemetry"
              label="Road Status"
              value={formatRoadDepartureWarning(roadDepartureWarning)}
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
