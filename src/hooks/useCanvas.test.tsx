/**
 * Tests for useCanvas.
 *
 * These tests verify lifecycle safety only.
 * They do not test rendering, resizing, physics, AI, or game-loop behavior.
 */

import { describe, expect, it } from "vitest";
import { render, screen } from "../tests/test-utils";
import { useCanvas } from "./useCanvas";

function TestCanvas() {
  const { canvasRef, isContextReady, initializeContext } = useCanvas();

  return (
    <div>
      <canvas
        ref={canvasRef}
        aria-label="Test canvas"
        data-testid="test-canvas"
      >
        Canvas fallback
      </canvas>

      <p data-testid="context-status">
        {isContextReady ? "ready" : "not-ready"}
      </p>

      <button type="button" onClick={initializeContext}>
        Initialize context
      </button>
    </div>
  );
}

function TestWithoutAttachedCanvas() {
  const { isContextReady, initializeContext } = useCanvas();

  return (
    <div>
      <p data-testid="context-status">
        {isContextReady ? "ready" : "not-ready"}
      </p>

      <button type="button" onClick={initializeContext}>
        Initialize context
      </button>
    </div>
  );
}

describe("useCanvas", () => {
  it("returns a canvas ref that can be attached to a canvas element", () => {
    render(<TestCanvas />);

    expect(screen.getByTestId("test-canvas")).toBeInTheDocument();
    expect(screen.getByLabelText("Test canvas")).toBeInTheDocument();
  });

  it("handles missing attached canvas safely", () => {
    render(<TestWithoutAttachedCanvas />);

    expect(screen.getByTestId("context-status")).toHaveTextContent("not-ready");
  });

  it("renders without throwing when context initialization is requested", async () => {
    const { userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();

    render(<TestCanvas />);

    await user.click(screen.getByRole("button", { name: "Initialize context" }));

    expect(screen.getByTestId("test-canvas")).toBeInTheDocument();
  });

  it("unmounts without throwing", () => {
    const { unmount } = render(<TestCanvas />);

    expect(() => unmount()).not.toThrow();
  });
});