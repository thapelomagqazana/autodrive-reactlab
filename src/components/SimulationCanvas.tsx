/**
 * SimulationCanvas component.
 *
 * Owns the primary HTML canvas rendering surface for AutoDrive ReactLab.
 *
 * Responsibilities:
 * - Render exactly one canvas element.
 * - Own the canvas ref.
 * - Provide accessible canvas labeling.
 * - Provide browser fallback text.
 * - Prepare for future 2D context usage.
 *
 * Non-responsibilities:
 * - No drawing logic.
 * - No physics.
 * - No AI.
 * - No game loop.
 * - No resizing logic.
 */

import { useRef } from "react";

export interface SimulationCanvasProps {
  /**
   * Accessible label used by assistive technology and tests.
   */
  label?: string;
}

export function SimulationCanvas({
  label = "AutoDrive simulation canvas",
}: SimulationCanvasProps) {
  /**
   * Owned canvas reference.
   *
   * Future canvas hooks/renderers may use this ref to access:
   * canvasRef.current?.getContext("2d")
   */
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  return (
    <section className="arcade-panel min-w-0 overflow-hidden p-4">
      <div className="relative z-10">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="arcade-accent text-xs font-black uppercase tracking-[0.3em]">
              Canvas Port
            </p>

            <h2 className="mt-1 text-lg font-black text-white">
              Simulation Canvas
            </h2>
          </div>

          <span className="arcade-badge rounded-full px-3 py-1 text-xs font-black">
            Surface Ready
          </span>
        </div>

        <div className="relative min-h-[28rem] overflow-hidden rounded-xl border border-cyan-300/20 bg-black/45">
          <canvas
            ref={canvasRef}
            aria-label={label}
            data-testid="simulation-canvas"
            className="block h-full min-h-[28rem] w-full"
          >
            Your browser does not support the HTML canvas element.
          </canvas>

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="rounded-xl border border-cyan-300/20 bg-black/60 px-5 py-4 text-center backdrop-blur">
              <p className="arcade-accent text-sm font-black uppercase tracking-[0.25em]">
                Render Surface Ready
              </p>

              <p className="mt-2 text-sm text-violet-100/75">
                Roads, vehicles, sensors, and debug overlays will render here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}