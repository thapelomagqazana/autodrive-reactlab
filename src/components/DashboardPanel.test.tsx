/**
 * Component tests for DashboardPanel.
 *
 * These tests verify that telemetry labels and values render without depending
 * on simulation engine, physics, AI, or replay implementation.
 */

import { describe, expect, it } from "vitest";
import { render, screen, within } from "../tests/test-utils";
import { DashboardPanel } from "./DashboardPanel";

describe("DashboardPanel", () => {
  it("renders the dashboard heading", () => {
    render(<DashboardPanel />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Dashboard" }),
    ).toBeInTheDocument();
  });

  it("renders all MVP metric labels", () => {
    render(<DashboardPanel />);

    expect(screen.getAllByRole("term")).toHaveLength(8);
    expect(screen.getAllByRole("definition")).toHaveLength(8);

    expect(screen.getByText("Speed")).toBeInTheDocument();
    expect(screen.getByText("Simulation")).toBeInTheDocument();
    expect(screen.getByText("FPS")).toBeInTheDocument();
    expect(screen.getByText("Time")).toBeInTheDocument();
    expect(screen.getByText("Sensors")).toBeInTheDocument();
    expect(screen.getByText("Traffic Light")).toBeInTheDocument();
    expect(screen.getByText("Collisions")).toBeInTheDocument();
    expect(screen.getByText("AI Confidence")).toBeInTheDocument();
  });

  it("renders placeholder values when telemetry is unavailable", () => {
    render(<DashboardPanel />);

    expect(screen.getByText("-- km/h")).toBeInTheDocument();
    expect(screen.getByText("Waiting")).toBeInTheDocument();
    expect(screen.getByText("Not connected")).toBeInTheDocument();
    expect(screen.getByText("N/A")).toBeInTheDocument();
    expect(screen.getByText("--%")).toBeInTheDocument();
  });

  it("renders provided telemetry values", () => {
    render(
      <DashboardPanel
        telemetry={{
          speed: "42 km/h",
          currentDecision: "Accelerating",
          collisionCount: "1",
          sensorStatus: "Online",
          simulationTime: "00:12.500",
          fps: "60",
          trafficLightState: "Green",
          aiConfidence: "87%",
        }}
      />,
    );

    expect(screen.getByText("42 km/h")).toBeInTheDocument();
    expect(screen.getByText("Accelerating")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("Online")).toBeInTheDocument();
    expect(screen.getByText("00:12.500")).toBeInTheDocument();
    expect(screen.getByText("60")).toBeInTheDocument();
    expect(screen.getByText("Green")).toBeInTheDocument();
    expect(screen.getByText("87%")).toBeInTheDocument();
  });

  it("keeps every metric as a label-value pair", () => {
    render(<DashboardPanel />);

    const dashboard = screen.getByRole("region", {
        name: /dashboard/i,
    });

    expect(within(dashboard).getByText("Speed")).toBeInTheDocument();
  });
});