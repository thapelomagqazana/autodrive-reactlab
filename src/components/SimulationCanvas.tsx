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
import { useEffect, useRef } from "react";
import { useCanvas, useCanvasResize } from "../hooks";
import { renderBackgroundGrid } from "../simulation/engine/gridRenderer";
import { beginFrame } from "../simulation/engine/frameRenderer";

export interface SimulationCanvasProps {
  /**
   * Accessible label used by assistive technology and tests.
   */
  label?: string;
  isGridEnabled?: boolean;
}

export function SimulationCanvas({
  label = "AutoDrive simulation canvas",
  isGridEnabled = true,
}: SimulationCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  /**
   * Owned canvas reference.
   *
   * Future canvas hooks/renderers may use this ref to access:
   * canvasRef.current?.getContext("2d")
   */
  const { canvasRef, context, dimensions, resizeCanvas, initializeContext } = useCanvas();

  useCanvasResize({
    containerRef,
    resizeCanvas,
  });

  useEffect(() => {
    initializeContext();
  }, [initializeContext]);

  useEffect(() => {
    if (!context || !dimensions) {
      return;
    }

    beginFrame(context, {
      width: dimensions.width,
      height: dimensions.height,
    });

    if (!isGridEnabled) {
      return;
    }

    renderBackgroundGrid(context, {
      width: dimensions.width,
      height: dimensions.height,
      spacing: 40 * dimensions.pixelRatio,
      enabled: isGridEnabled,
    });
  }, [context, dimensions, isGridEnabled]);

  return (
    <section className="arcade-panel min-w-0 overflow-hidden p-4">
      <div className="relative z-10">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="arcade-accent text-xs font-black uppercase tracking-[0.3em]">
              Canvas Port
            </p>

            <h2 className="mt-1 text-lg font-black text-white">Simulation Canvas</h2>
          </div>

          <span className="arcade-badge rounded-full px-3 py-1 text-xs font-black">
            Grid Online
          </span>
        </div>

        <div
          ref={containerRef}
          className="relative h-[28rem] overflow-hidden rounded-xl border border-cyan-300/20 bg-black/45 md:h-[34rem] xl:h-[42rem]"
        >
          <canvas
            ref={canvasRef}
            aria-label={label}
            data-testid="simulation-canvas"
            className="block h-full w-full"
          >
            Your browser does not support the HTML canvas element.
          </canvas>

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="rounded-xl border border-cyan-300/20 bg-black/60 px-5 py-4 text-center backdrop-blur">
              <p className="arcade-accent text-sm font-black uppercase tracking-[0.25em]">
                Render Surface Ready
              </p>

              <p className="mt-2 text-sm text-violet-100/75">
                Background grid verifies the canvas rendering pipeline.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
