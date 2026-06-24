/**
 * Header component for AutoDrive ReactLab.
 *
 * Theme:
 * Tesla FSD + NASA Mission Control Hybrid
 */

export interface HeaderProps {
  title?: string;
  subtitle?: string;
  phaseLabel?: string;
  eyebrow?: string;
}

export function Header({
  title = "AutoDrive Lab",
  eyebrow = "Autonomous Vehicle Mission Control",
  subtitle = "A browser-based autonomous driving simulation platform with real-time telemetry, perception overlays, control systems, and safety-focused vehicle intelligence.",
  phaseLabel = "Phase 0 · Foundation",
}: HeaderProps) {
  return (
    <header className="mission-panel p-6">
      <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="mission-accent text-sm font-black uppercase tracking-[0.35em]">
            {eyebrow}
          </p>

          <h1 className="mission-title mt-3 text-5xl font-black tracking-tight md:text-7xl xl:text-8xl">
            {title}
          </h1>

          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300 md:text-lg">
            {subtitle}
          </p>
        </div>

        <span className="mission-badge inline-flex w-fit shrink-0 rounded-full px-4 py-1 text-sm font-black">
          {phaseLabel}
        </span>
      </div>
    </header>
  );
}
