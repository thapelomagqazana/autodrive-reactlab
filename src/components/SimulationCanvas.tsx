/**
 * SimulationCanvas component.
 */

import { useEffect, useMemo, useRef } from "react";
import { useCanvas, useCanvasResize } from "../hooks";
import { beginFrame } from "../simulation/engine/frameRenderer";
import { renderBackgroundGrid } from "../simulation/engine/gridRenderer";
import { drawRoad } from "../simulation/engine/roadRenderer";
import { createFixedRoadForViewport } from "../simulation/world/roadViewport";

export interface SimulationCanvasProps {
  label?: string;
  isGridEnabled?: boolean;
}

interface CanvasDimensions {
  width: number;
  height: number;
  pixelRatio?: number;
}

function hasValidCanvasDimensions(
  dimensions: CanvasDimensions | null,
): dimensions is CanvasDimensions {
  return (
    dimensions !== null &&
    Number.isFinite(dimensions.width) &&
    Number.isFinite(dimensions.height) &&
    dimensions.width > 0 &&
    dimensions.height > 0
  );
}

export function SimulationCanvas({
  label = "AutoDrive simulation canvas",
  isGridEnabled = true,
}: SimulationCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { canvasRef, context, dimensions, resizeCanvas, initializeContext } = useCanvas();

  useCanvasResize({
    containerRef,
    resizeCanvas,
  });

  useEffect(() => {
    initializeContext();
  }, [initializeContext]);

  const road = useMemo(() => {
    if (!hasValidCanvasDimensions(dimensions)) {
      return null;
    }

    return createFixedRoadForViewport({
      width: dimensions.width,
      height: dimensions.height,
    });
  }, [dimensions]);

  useEffect(() => {
    if (!context || !hasValidCanvasDimensions(dimensions)) {
      return;
    }

    beginFrame(context, {
      width: dimensions.width,
      height: dimensions.height,
    });

    if (isGridEnabled) {
      renderBackgroundGrid(context, {
        width: dimensions.width,
        height: dimensions.height,
        spacing: 40 * (dimensions.pixelRatio ?? 1),
        enabled: isGridEnabled,
      });
    }

    if (road) {
      drawRoad(context, road);
    }
  }, [context, dimensions, isGridEnabled, road]);

  return (
    <section className="mission-panel min-w-0 overflow-hidden p-4">
      <div className="relative z-10">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="mission-accent text-xs font-black uppercase tracking-[0.3em]">
              Perception Viewport
            </p>

            <h2 className="mt-1 text-lg font-black text-slate-50">Simulation Canvas</h2>
          </div>

          <span className="mission-badge rounded-full px-3 py-1 text-xs font-black">
            Grid Online
          </span>
        </div>

        <div
          ref={containerRef}
          className="relative h-[28rem] overflow-hidden rounded-xl border border-sky-300/20 bg-slate-950/70 shadow-inner md:h-[34rem] xl:h-[42rem]"
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
            <div className="rounded-xl border border-sky-300/20 bg-slate-950/70 px-5 py-4 text-center shadow-[0_0_24px_rgb(56_189_248_/_0.12)] backdrop-blur">
              <p className="mission-accent text-sm font-black uppercase tracking-[0.25em]">
                Render Surface Ready
              </p>

              <p className="mt-2 text-sm text-slate-300">
                Mission-control grid confirms the canvas rendering pipeline.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
