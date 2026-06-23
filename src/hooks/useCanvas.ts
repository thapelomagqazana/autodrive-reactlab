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

export interface UseCanvasResult {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  context: CanvasRenderingContext2D | null;
  isContextReady: boolean;
  initializeContext: () => CanvasRenderingContext2D | null;
}

export function useCanvas(): UseCanvasResult {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);

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

  useEffect(() => {
    initializeContext();

    return () => {
      setContext(null);
    };
  }, [initializeContext]);

  return {
    canvasRef,
    context,
    isContextReady: context !== null,
    initializeContext,
  };
}