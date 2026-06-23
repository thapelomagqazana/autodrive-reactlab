/**
 * DashboardPanel component.
 *
 * Displays simulation telemetry with visual hierarchy:
 * - Primary metrics receive larger emphasis.
 * - Secondary metrics remain compact.
 * - Placeholder values remain visually muted.
 *
 * This component displays telemetry only.
 * It does not calculate simulation state.
 */

export interface DashboardTelemetry {
  speed: string;
  currentDecision: string;
  collisionCount: string;
  sensorStatus: string;
  simulationTime: string;
  fps: string;
  trafficLightState: string;
  aiConfidence: string;
}

export interface DashboardPanelProps {
  telemetry?: Partial<DashboardTelemetry>;
}

type MetricPriority = "primary" | "secondary";

interface MetricDefinition {
  key: keyof DashboardTelemetry;
  label: string;
  priority: MetricPriority;
}

const PLACEHOLDER_TELEMETRY: DashboardTelemetry = {
  speed: "-- km/h",
  currentDecision: "Waiting",
  collisionCount: "0",
  sensorStatus: "Not connected",
  simulationTime: "00:00.000",
  fps: "--",
  trafficLightState: "N/A",
  aiConfidence: "--%",
};

const METRICS: MetricDefinition[] = [
  { key: "speed", label: "Speed", priority: "primary" },
  { key: "currentDecision", label: "Simulation", priority: "primary" },
  { key: "fps", label: "FPS", priority: "primary" },
  { key: "simulationTime", label: "Time", priority: "secondary" },
  { key: "sensorStatus", label: "Sensors", priority: "secondary" },
  { key: "trafficLightState", label: "Traffic Light", priority: "secondary" },
  { key: "collisionCount", label: "Collisions", priority: "secondary" },
  { key: "aiConfidence", label: "AI Confidence", priority: "secondary" },
];

function buildTelemetry(
  telemetry?: Partial<DashboardTelemetry>,
): DashboardTelemetry {
  return {
    ...PLACEHOLDER_TELEMETRY,
    ...telemetry,
  };
}

function isPlaceholderValue(value: string): boolean {
  return value.includes("--") || value === "N/A" || value === "Not connected";
}

interface MetricCardProps {
  label: string;
  value: string;
  priority: MetricPriority;
}

/**
 * MetricCard displays one label-value telemetry pair.
 *
 * Primary cards are larger because they represent the values users scan first.
 * Secondary cards are compact to reduce dashboard repetition.
 */
function MetricCard({ label, value, priority }: MetricCardProps) {
  const isPlaceholder = isPlaceholderValue(value);

  if (priority === "primary") {
    return (
      <div className="arcade-metric p-4">
        <dt className="text-xs font-black uppercase tracking-[0.22em] text-violet-100/60">
          {label}
        </dt>
        <dd
          className={
            isPlaceholder
              ? "mt-2 text-3xl font-black text-violet-100/55"
              : "mt-2 text-3xl font-black text-cyan-300"
          }
        >
          {value}
        </dd>
      </div>
    );
  }

  return (
    <div className="border-t border-cyan-300/15 py-3 first:border-t-0">
      <dt className="text-xs font-bold uppercase tracking-[0.18em] text-violet-100/55">
        {label}
      </dt>
      <dd
        className={
          isPlaceholder
            ? "mt-1 text-sm font-black text-violet-100/55"
            : "mt-1 text-sm font-black text-cyan-300"
        }
      >
        {value}
      </dd>
    </div>
  );
}

export function DashboardPanel({ telemetry }: DashboardPanelProps) {
  const resolvedTelemetry = buildTelemetry(telemetry);
  const primaryMetrics = METRICS.filter((metric) => metric.priority === "primary");
  const secondaryMetrics = METRICS.filter(
    (metric) => metric.priority === "secondary",
  );

  return (
    <section className="arcade-panel p-5" aria-labelledby="dashboard-panel-title">
      <div className="relative z-10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="arcade-accent text-xs font-black uppercase tracking-[0.25em]">
              Telemetry Deck
            </p>

            <h2
              id="dashboard-panel-title"
              className="mt-1 text-lg font-black text-white"
            >
              Dashboard
            </h2>
          </div>

          <span className="arcade-badge rounded-full px-3 py-1 text-xs font-black">
            Preview
          </span>
        </div>

        <dl className="mt-5 grid gap-4">
          {primaryMetrics.map((metric) => (
            <MetricCard
              key={metric.key}
              label={metric.label}
              value={resolvedTelemetry[metric.key]}
              priority={metric.priority}
            />
          ))}
        </dl>

        <dl className="mt-5 rounded-xl border border-cyan-300/15 bg-black/25 px-4">
          {secondaryMetrics.map((metric) => (
            <MetricCard
              key={metric.key}
              label={metric.label}
              value={resolvedTelemetry[metric.key]}
              priority={metric.priority}
            />
          ))}
        </dl>
      </div>
    </section>
  );
}