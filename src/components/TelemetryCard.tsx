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

export interface TelemetryCardProps {
  label: string;
  value: string;
  isPlaceholder?: boolean;
  testId?: string;
}

export function TelemetryCard({
  label,
  value,
  isPlaceholder = false,
  testId,
}: TelemetryCardProps) {
  return (
    <article
      data-testid={testId}
      className="rounded-xl border border-cyan-300/20 bg-black/40 p-4"
    >
      <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
        {label}
      </p>

      <p
        className={[
          "mt-2 text-lg font-black",
          isPlaceholder ? "text-slate-400 italic" : "text-white",
        ].join(" ")}
      >
        {value}
      </p>
    </article>
  );
}
