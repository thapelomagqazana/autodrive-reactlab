import type { SensorDebugSummary } from "../simulation/sensors/sensorDebugSummary";

export interface SensorDebugPanelProps {
  readonly summary: SensorDebugSummary;
}

function formatGroupName(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function SensorDebugPanel({ summary }: SensorDebugPanelProps) {
  const nearest = summary.nearestDetection;

  return (
    <section aria-label="Sensor debug panel" className="rounded-lg border p-4">
      <h2 className="text-sm font-semibold">Sensors</h2>

      <dl className="mt-3 grid gap-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt>Status</dt>
          <dd>{summary.status}</dd>
        </div>

        <div className="flex justify-between gap-4">
          <dt>Front</dt>
          <dd>{summary.front.displayDistance}</dd>
        </div>

        <div className="flex justify-between gap-4">
          <dt>Left</dt>
          <dd>{summary.left.displayDistance}</dd>
        </div>

        <div className="flex justify-between gap-4">
          <dt>Right</dt>
          <dd>{summary.right.displayDistance}</dd>
        </div>

        <div className="flex justify-between gap-4">
          <dt>Nearest detection</dt>
          <dd>
            {nearest === null
              ? "None"
              : `${formatGroupName(nearest.group)} ${nearest.detectionType} at ${
                  nearest.displayDistance
                }`}
          </dd>
        </div>
      </dl>
    </section>
  );
}
