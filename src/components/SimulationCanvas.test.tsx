/**
 * Component tests for SimulationCanvas.
 *
 * These tests verify the canvas surface contract only.
 * They intentionally do not test rendering, physics, AI, or game-loop behavior.
 */

import { describe, expect, it } from "vitest";
import { render, screen } from "../tests/test-utils";
import { SimulationCanvas } from "./SimulationCanvas";

describe("SimulationCanvas", () => {
  it("renders exactly one canvas element", () => {
    render(<SimulationCanvas />);

    const canvases = screen.getAllByTestId("simulation-canvas");

    expect(canvases).toHaveLength(1);
    expect(canvases[0]?.tagName.toLowerCase()).toBe("canvas");
  });

  it("renders an accessible canvas label", () => {
    render(<SimulationCanvas />);

    expect(screen.getByLabelText("AutoDrive simulation canvas")).toBeInTheDocument();
  });

  it("includes browser fallback text inside the canvas", () => {
    render(<SimulationCanvas />);

    expect(
      screen.getByText("Your browser does not support the HTML canvas element."),
    ).toBeInTheDocument();
  });

  it("supports a custom accessible label", () => {
    render(<SimulationCanvas label="Custom simulation surface" />);

    expect(screen.getByLabelText("Custom simulation surface")).toBeInTheDocument();
  });

  it("renders placeholder context without adding extra canvases", () => {
    render(<SimulationCanvas />);

    expect(screen.getByText("Simulation Canvas")).toBeInTheDocument();
    expect(screen.getByText("Render Surface Ready")).toBeInTheDocument();
    expect(screen.getAllByTestId("simulation-canvas")).toHaveLength(1);
  });
});
