/**
 * StatusBadge component.
 *
 * Displays the current simulation lifecycle status in a user-readable form.
 * This component is intentionally small and stable so it can validate the
 * component testing setup without depending on the full simulator UI.
 */

export type StatusBadgeStatus = "idle" | "running" | "paused";

export interface StatusBadgeProps {
  /**
   * Current simulation lifecycle status.
   */
  status: StatusBadgeStatus;
}

const STATUS_LABELS: Record<StatusBadgeStatus, string> = {
  idle: "Idle",
  running: "Running",
  paused: "Paused",
};

const STATUS_STYLES: Record<StatusBadgeStatus, string> = {
  idle: "border-slate-600 bg-slate-900 text-slate-300",
  running: "border-emerald-500/60 bg-emerald-950 text-emerald-300",
  paused: "border-amber-500/60 bg-amber-950 text-amber-300",
};

/**
 * Renders an accessible status indicator.
 */
export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <output
      aria-label="Simulation status"
      className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </output>
  );
}
