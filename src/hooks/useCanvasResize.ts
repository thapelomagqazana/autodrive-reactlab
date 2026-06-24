/**
 * useCanvasResize
 *
 * Keeps the canvas drawing buffer synchronized with its visible container size.
 *
 * Responsibilities:
 * - Observe container size changes.
 * - Resize the canvas drawing buffer.
 * - Respect devicePixelRatio through useCanvas.resizeCanvas().
 * - Clean up ResizeObserver on unmount.
 * - Expose a future redraw callback point.
 *
 * Non-responsibilities:
 * - No drawing.
 * - No game loop.
 * - No physics.
 * - No AI.
 * - No sensor rendering.
 */

import { useEffect } from "react";
import type { CanvasBufferSize } from "../simulation/engine/canvasSizing";

export interface UseCanvasResizeOptions {
  containerRef: React.RefObject<HTMLElement | null>;
  resizeCanvas: (size: { width: number; height: number }) => CanvasBufferSize | null;
  onResize?: (dimensions: CanvasBufferSize) => void;
}

function getElementSize(element: HTMLElement): { width: number; height: number } {
  const rect = element.getBoundingClientRect();

  return {
    width: Math.max(0, rect.width),
    height: Math.max(0, rect.height),
  };
}

export function useCanvasResize({
  containerRef,
  resizeCanvas,
  onResize,
}: UseCanvasResizeOptions): void {
  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const applyCurrentSize = () => {
      const size = getElementSize(container);
      const dimensions = resizeCanvas(size);

      if (dimensions) {
        onResize?.(dimensions);
      }
    };

    applyCurrentSize();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", applyCurrentSize);

      return () => {
        window.removeEventListener("resize", applyCurrentSize);
      };
    }

    const observer = new ResizeObserver(() => {
      applyCurrentSize();
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [containerRef, onResize, resizeCanvas]);
}
