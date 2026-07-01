/**
 * TelemetryCard component.
 *
 * Reusable metric card for dashboard telemetry.
 *
 * Responsibilities:
 * - Display a telemetry label.
 * - Display a telemetry value.
 * - Visually distinguish placeholder data from live data.
 *
 * Non-responsibilities:
 * - No Zustand access.
 * - No physics calculations.
 * - No AI calculations.
 * - No sensor calculations.
 */

export type TelemetryTone = "default" | "success" | "warning" | "danger";

export interface TelemetryCardProps {
  label: string;
  value: string;
  isPlaceholder?: boolean;
  testId?: string;
  tone?: TelemetryTone;
}

function getToneClassName(tone: TelemetryTone): string {
  switch (tone) {
    case "success":
      return "border-emerald-300/40 bg-emerald-950/30 text-emerald-200";
    case "warning":
      return "border-amber-300/50 bg-amber-950/30 text-amber-200";
    case "danger":
      return "border-red-300/50 bg-red-950/30 text-red-200";
    case "default":
    default:
      return "border-cyan-300/20 bg-black/40 text-white";
  }
}

export function TelemetryCard({
  label,
  value,
  isPlaceholder = false,
  testId,
  tone = "default",
}: TelemetryCardProps) {
  return (
    <article
      data-testid={testId}
      className={`rounded-xl border p-4 ${getToneClassName(tone)}`}
    >
      <dt className="text-xs font-black uppercase tracking-[0.2em] text-sky-300">
        {label}
      </dt>

      <dd
        className={
          isPlaceholder
            ? "mt-2 text-lg font-black italic text-slate-400"
            : "mt-2 text-lg font-black"
        }
      >
        {value}
      </dd>
    </article>
  );
}
