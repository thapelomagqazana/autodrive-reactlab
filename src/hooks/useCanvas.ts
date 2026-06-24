/**
 * useCanvas
 *
 * Reusable canvas lifecycle hook for AutoDrive ReactLab.
 *
 * Responsibilities:
 * - Own a stable canvas ref.
 * - Safely retrieve a 2D rendering context.
 * - Expose context availability.
 * - Clean up local hook state on unmount.
 *
 * Non-responsibilities:
 * - No drawing.
 * - No resizing.
 * - No physics.
 * - No AI.
 * - No game loop.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  applyCanvasSize,
  type CanvasBufferSize,
  type CanvasCssSize,
} from "../simulation/engine/canvasSizing";

export interface UseCanvasResult {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  context: CanvasRenderingContext2D | null;
  isContextReady: boolean;
  dimensions: CanvasBufferSize | null;
  initializeContext: () => CanvasRenderingContext2D | null;
  resizeCanvas: (cssSize: CanvasCssSize) => CanvasBufferSize | null;
}

export function useCanvas(): UseCanvasResult {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [dimensions, setDimensions] = useState<CanvasBufferSize | null>(null);

  const initializeContext = useCallback(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      setContext(null);
      return null;
    }

    const nextContext = canvas.getContext("2d");
    setContext(nextContext);

    return nextContext;
  }, []);

  const resizeCanvas = useCallback((cssSize: CanvasCssSize) => {
    const canvas = canvasRef.current;

    if (!canvas) {
      setDimensions(null);
      return null;
    }

    const nextDimensions = applyCanvasSize(canvas, cssSize, window.devicePixelRatio);

    setDimensions(nextDimensions);

    return nextDimensions;
  }, []);

  useEffect(() => {
    initializeContext();

    return () => {
      setContext(null);
      setDimensions(null);
    };
  }, [initializeContext]);

  return {
    canvasRef,
    context,
    isContextReady: context !== null,
    dimensions,
    initializeContext,
    resizeCanvas,
  };
}
