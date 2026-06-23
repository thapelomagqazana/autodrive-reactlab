/**
 * Header component for AutoDrive ReactLab.
 *
 * Responsibility:
 * - Display project identity.
 * - Explain the simulator purpose.
 * - Show current phase/status context.
 *
 * Non-responsibility:
 * - No simulation engine logic.
 * - No Zustand mutation.
 * - No AppShell layout ownership.
 * - No GitHub API or navigation logic.
 */

export interface HeaderProps {
  /** Main product/project name. */
  title?: string;

  /** Short description explaining what the simulator does. */
  subtitle?: string;

  /** Current phase, milestone, or status label. */
  phaseLabel?: string;

  /** Optional eyebrow text above the title. */
  eyebrow?: string;
}

export function Header({
  title = "AutoDrive ReactLab",
  eyebrow = "Autonomous Simulation Lab",
  subtitle = "A retro arcade autonomous driving simulator with state, telemetry, controls, and future canvas-based vehicle intelligence.",
  phaseLabel = "Phase 0 · Foundation",
}: HeaderProps) {
  return (
    <div className="arcade-panel p-6">
      <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="arcade-accent text-sm font-black uppercase tracking-[0.35em]">
            {eyebrow}
          </p>

          <h1 className="arcade-title mt-3 text-4xl font-black tracking-tight md:text-6xl">
            {title}
          </h1>

          <p className="mt-4 max-w-3xl text-base leading-7 text-violet-100/80">
            {subtitle}
          </p>
        </div>

        <span className="arcade-badge inline-flex w-fit shrink-0 rounded-full px-4 py-1 text-sm font-black">
          {phaseLabel}
        </span>
      </div>
    </div>
  );
}