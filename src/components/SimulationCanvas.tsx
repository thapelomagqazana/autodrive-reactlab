/**
 * SimulationCanvas component.
 *
 * Responsibility:
 * - Own the initial HTML canvas rendering surface.
 * - Provide a visible placeholder for future rendering work.
 * - Prepare a local canvas ref for future 2D renderer integration.
 *
 * Non-responsibility:
 * - No physics.
 * - No AI.
 * - No game loop.
 * - No sensor raycasting.
 * - No collision detection.
 */

import { useRef } from "react";

export interface SimulationCanvasProps {
  /**
   * Accessible label for the canvas region.
   */
  label?: string;
}

export function SimulationCanvas({
  label = "AutoDrive simulation canvas",
}: SimulationCanvasProps) {
  /**
   * Local canvas reference.
   *
   * Future renderer work can use this ref to obtain:
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
            Placeholder
          </span>
        </div>

        <div className="relative min-h-[28rem] overflow-hidden rounded-xl border border-cyan-300/20 bg-black/45">
          <canvas
            ref={canvasRef}
            aria-label={label}
            className="h-full min-h-[28rem] w-full bg-[linear-gradient(rgba(0,234,255,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(255,43,214,0.12)_1px,transparent_1px)] bg-[size:40px_40px]"
            data-testid="simulation-canvas"
          >
            Your browser does not support the HTML canvas element.
          </canvas>

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="rounded-xl border border-cyan-300/20 bg-black/60 px-5 py-4 text-center backdrop-blur">
              <p className="arcade-accent text-sm font-black uppercase tracking-[0.25em]">
                Render Surface Ready
              </p>
              <p className="mt-2 text-sm text-violet-100/75">
                Future roads, vehicles, sensors, and debug overlays render here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}