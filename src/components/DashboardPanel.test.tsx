import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardPanel } from "./DashboardPanel";

describe("DashboardPanel", () => {
  it("renders lifecycle status", () => {
    render(<DashboardPanel status="running" simulationTimeSeconds={0} fps={60} />);

    expect(screen.getByText("Running")).toBeInTheDocument();
    expect(screen.getByLabelText("Simulation status: Running")).toBeInTheDocument();
  });

  it("renders formatted elapsed time and FPS", () => {
    render(
      <DashboardPanel status="idle" simulationTimeSeconds={61.5} fps={59.6} />,
    );

    expect(screen.getByText("00:01:01.500")).toBeInTheDocument();
    expect(screen.getByText("60")).toBeInTheDocument();
  });

  it("renders canvas diagnostics when provided", () => {
    render(
      <DashboardPanel
        status="idle"
        simulationTimeSeconds={0}
        fps={0}
        canvasDiagnostics={{
          width: 1280,
          height: 720,
          pixelRatio: 2,
          bufferWidth: 2560,
          bufferHeight: 1440,
        }}
      />,
    );

    expect(screen.getByLabelText("Canvas Diagnostics")).toBeInTheDocument();
    expect(screen.getByText("1280px")).toBeInTheDocument();
    expect(screen.getByText("720px")).toBeInTheDocument();
    expect(screen.getByText("2560 × 1440")).toBeInTheDocument();
  });

  it("renders vehicle telemetry placeholders", () => {
    render(<DashboardPanel status="idle" simulationTimeSeconds={0} fps={0} />);

    expect(screen.getByLabelText("Vehicle Telemetry")).toBeInTheDocument();

    expect(screen.getByText("Vehicle Speed")).toBeInTheDocument();
    expect(screen.getByText("Acceleration")).toBeInTheDocument();
    expect(screen.getByText("Steering Angle")).toBeInTheDocument();
    expect(screen.getByText("Heading")).toBeInTheDocument();
    expect(screen.getByText("AI Decision")).toBeInTheDocument();
    expect(screen.getByText("Collision Count")).toBeInTheDocument();
    expect(screen.getByText("Sensor Status")).toBeInTheDocument();
    expect(screen.getByText("Destination Status")).toBeInTheDocument();

    expect(screen.getByText("Waiting for simulation")).toBeInTheDocument();
    expect(screen.getByText("Not connected")).toBeInTheDocument();
    expect(screen.getByText("N/A")).toBeInTheDocument();
  });
});