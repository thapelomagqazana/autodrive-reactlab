/**
 * SimulationCanvas component.
 *
 * Owns the canvas element and renders the MVP road + car frame.
 */

import { useEffect, useRef } from "react";
import { useCanvas, useCanvasResize } from "../hooks";
import { beginFrame } from "../simulation/engine/frameRenderer";
import { renderBackgroundGrid } from "../simulation/engine/gridRenderer";
import { drawSimulationFrame } from "../simulation/engine/simulationFrameRenderer";
import {
  useSimulationCamera,
  useSimulationCar,
  useSimulationRoad,
  useSimulationUiPreferences,
  useSetCanvasDiagnostics,
} from "../store";
import { resolveCameraForView } from "../simulation/camera";

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

  const road = useSimulationRoad();
  const car = useSimulationCar();
  const camera = useSimulationCamera();
  const ui = useSimulationUiPreferences();
  const setCanvasDiagnostics = useSetCanvasDiagnostics();

  const { canvasRef, context, dimensions, resizeCanvas, initializeContext } = useCanvas();

  useCanvasResize({
    containerRef,
    resizeCanvas,
  });

  useEffect(() => {
    initializeContext();
  }, [initializeContext]);

  useEffect(() => {
    if (!hasValidCanvasDimensions(dimensions)) {
      setCanvasDiagnostics(null);
      return;
    }

    const pixelRatio = dimensions.pixelRatio ?? window.devicePixelRatio ?? 1;

    setCanvasDiagnostics({
      width: dimensions.width,
      height: dimensions.height,
      pixelRatio,
      bufferWidth: Math.round(dimensions.width * pixelRatio),
      bufferHeight: Math.round(dimensions.height * pixelRatio),
    });
  }, [dimensions, setCanvasDiagnostics]);

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

    const renderCamera = resolveCameraForView(camera, car, {
      width: dimensions.width,
      height: dimensions.height,
    });

    const visibleTopY = -renderCamera.offsetY;
    const visibleBottomY = visibleTopY + dimensions.height;

    drawSimulationFrame(context, road, car, {
      camera: renderCamera,
      road: {
        showCenterGuide: ui.isDebugModeEnabled,
        visibleTopY,
        visibleBottomY,
      },
    });
  }, [context, dimensions, isGridEnabled, road, car, camera, ui.isDebugModeEnabled]);

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
            Road + Car Online
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
            tabIndex={0}
            className="block h-full w-full outline-none focus:outline-none focus:ring-0"
          >
            Your browser does not support the HTML canvas element.
          </canvas>
        </div>
      </div>
    </section>
  );
}
