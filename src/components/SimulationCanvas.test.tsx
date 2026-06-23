/**
 * Component tests for SimulationCanvas.
 *
 * These tests verify that the canvas rendering surface exists without testing
 * future rendering, physics, or game loop behavior.
 */

import { describe, expect, it } from "vitest";
import { render, screen } from "../tests/test-utils";
import { SimulationCanvas } from "./SimulationCanvas";

describe("SimulationCanvas", () => {
  it("renders the simulation canvas element", () => {
    render(<SimulationCanvas />);

    expect(screen.getByTestId("simulation-canvas")).toBeInTheDocument();
  });

  it("renders an accessible canvas label", () => {
    render(<SimulationCanvas />);

    expect(
      screen.getByLabelText("AutoDrive simulation canvas"),
    ).toBeInTheDocument();
  });

  it("renders the placeholder context", () => {
    render(<SimulationCanvas />);

    expect(screen.getByText("Simulation Canvas")).toBeInTheDocument();
    expect(screen.getByText("Render Surface Ready")).toBeInTheDocument();
  });

  it("supports a custom accessible label", () => {
    render(<SimulationCanvas label="Custom canvas label" />);

    expect(screen.getByLabelText("Custom canvas label")).toBeInTheDocument();
  });
});