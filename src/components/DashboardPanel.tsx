/**
 * DashboardPanel component.
 *
 * Theme:
 * Tesla FSD + NASA Mission Control Hybrid
 */

import { useId, useState } from "react";
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
import {
  DEFAULT_TELEMETRY_TAB_ID,
  TELEMETRY_TABS,
  type TelemetryTabId,
} from "./telemetryTabs";

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

interface TelemetryTabButtonProps {
  tabId: TelemetryTabId;
  label: string;
  selectedTabId: TelemetryTabId;
  controlsId: string;
  onSelect: (tabId: TelemetryTabId) => void;
}

/**
 * Accessible tab button used by the mission telemetry panel.
 */
function TelemetryTabButton({
  tabId,
  label,
  selectedTabId,
  controlsId,
  onSelect,
}: TelemetryTabButtonProps) {
  const isSelected = selectedTabId === tabId;

  return (
    <button
      type="button"
      role="tab"
      id={`telemetry-tab-${tabId}`}
      aria-selected={isSelected}
      aria-controls={controlsId}
      tabIndex={isSelected ? 0 : -1}
      className={[
        "rounded-lg border px-3 py-2 text-xs font-black uppercase tracking-[0.18em] transition",
        isSelected
          ? "border-cyan-300/60 bg-cyan-300/15 text-cyan-100"
          : "border-sky-300/20 bg-slate-950/40 text-slate-400 hover:border-sky-300/50 hover:text-sky-100",
      ].join(" ")}
      onClick={() => onSelect(tabId)}
    >
      {label}
    </button>
  );
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

function MetricCard({
  label,
  value,
  testId,
}: {
  label: string;
  value: string;
  testId?: string;
}) {
  return (
    <article data-testid={testId} className="mission-metric p-4">
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
  const [activeTelemetryTabId, setActiveTelemetryTabId] = useState<TelemetryTabId>(
    DEFAULT_TELEMETRY_TAB_ID,
  );

  const telemetryPanelId = useId();

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

          <MetricCard testId="fps-telemetry" label="FPS" value={formatFps(fps)} />
        </dl>

        <section aria-label="Mission Telemetry Tabs" className="mt-5">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
            Mission Telemetry
          </h3>

          <div
            role="tablist"
            aria-label="Mission telemetry categories"
            className="mt-3 grid grid-cols-2 gap-2"
          >
            {TELEMETRY_TABS.map((tab) => (
              <TelemetryTabButton
                key={tab.id}
                tabId={tab.id}
                label={tab.label}
                selectedTabId={activeTelemetryTabId}
                controlsId={`${telemetryPanelId}-${tab.id}`}
                onSelect={setActiveTelemetryTabId}
              />
            ))}
          </div>

          <div
            role="tabpanel"
            id={`${telemetryPanelId}-${activeTelemetryTabId}`}
            aria-labelledby={`telemetry-tab-${activeTelemetryTabId}`}
            className="mt-3"
          >
            {activeTelemetryTabId === "vehicle" ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                  testId="vehicle-heading-telemetry"
                  label="Heading"
                  value={formatVehicleHeading(vehicleHeading)}
                />

                <TelemetryCard
                  testId="vehicle-position-telemetry"
                  label="Position"
                  value={formatVehiclePosition(vehiclePositionX, vehiclePositionY)}
                />

                <TelemetryCard
                  testId="road-status-telemetry"
                  label="Road Status"
                  value={formatRoadDepartureWarning(roadDepartureWarning)}
                  tone={roadDepartureWarning ? "danger" : "success"}
                />
              </div>
            ) : null}

            {activeTelemetryTabId === "performance" ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <TelemetryCard
                  label="Frame Time"
                  value={fps > 0 ? `${Math.round(1000 / fps)} ms` : "0 ms"}
                />

                {canvasDiagnostics ? (
                  <>
                    <TelemetryCard
                      label="Canvas"
                      value={formatCanvasResolution(
                        canvasDiagnostics.width,
                        canvasDiagnostics.height,
                      )}
                    />

                    <TelemetryCard
                      label="Buffer"
                      value={formatCanvasResolution(
                        canvasDiagnostics.bufferWidth,
                        canvasDiagnostics.bufferHeight,
                      )}
                    />

                    <TelemetryCard
                      label="DPR"
                      value={`${canvasDiagnostics.pixelRatio}`}
                    />
                  </>
                ) : (
                  <TelemetryCard label="Canvas" value="Not available" isPlaceholder />
                )}

                <TelemetryCard label="Memory" value="Not tracked" isPlaceholder />
              </div>
            ) : null}

            {activeTelemetryTabId === "ai" ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <TelemetryCard
                  label="AI Decision"
                  value={DEFAULT_VEHICLE_TELEMETRY_PLACEHOLDERS.aiDecision}
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
            ) : null}

            {activeTelemetryTabId === "debug" ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <TelemetryCard
                  testId="vehicle-steering-telemetry"
                  label="Steering Angle"
                  value={formatSteeringAngle(steeringAngle)}
                />

                <TelemetryCard
                  label="Collision Count"
                  value={DEFAULT_VEHICLE_TELEMETRY_PLACEHOLDERS.collisionCount}
                  isPlaceholder
                />

                <TelemetryCard label="Lane" value="Not tracked" isPlaceholder />

                <TelemetryCard
                  testId="camera-debug-telemetry"
                  label="Camera"
                  value="Tracked in controls"
                  isPlaceholder
                />

                <TelemetryCard label="Offsets" value="Not displayed" isPlaceholder />
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </section>
  );
}
