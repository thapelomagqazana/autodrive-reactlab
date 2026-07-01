import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { DashboardPanel } from "./DashboardPanel";

function renderDashboard() {
  return render(
    <DashboardPanel
      status="idle"
      simulationTimeSeconds={0}
      fps={0}
      vehicleSpeed={0}
      vehicleAcceleration={120}
      steeringAngle={0}
      vehiclePositionX={400}
      vehiclePositionY={600}
      vehicleHeading={0}
      roadDepartureWarning={false}
    />,
  );
}

describe("DashboardPanel", () => {
  it("renders lifecycle status", () => {
    render(
      <DashboardPanel
        status="running"
        simulationTimeSeconds={0}
        fps={60}
        vehicleSpeed={0}
        vehicleAcceleration={120}
        steeringAngle={0}
        vehiclePositionX={400}
        vehiclePositionY={600}
        vehicleHeading={0}
        roadDepartureWarning={false}
      />,
    );

    expect(screen.getByText("Running")).toBeInTheDocument();
    expect(screen.getByLabelText("Simulation status: Running")).toBeInTheDocument();
  });

  it("renders formatted elapsed time and FPS", () => {
    render(
      <DashboardPanel
        status="idle"
        simulationTimeSeconds={61.5}
        fps={59.6}
        vehicleSpeed={0}
        vehicleAcceleration={120}
        steeringAngle={0}
        vehiclePositionX={400}
        vehiclePositionY={600}
        vehicleHeading={0}
        roadDepartureWarning={false}
      />,
    );

    expect(screen.getByText("00:01:01.500")).toBeInTheDocument();
    expect(screen.getByTestId("fps-telemetry")).toHaveTextContent("60");
  });

  it("renders vehicle tab by default", () => {
    renderDashboard();

    expect(screen.getByRole("tab", { name: "Vehicle" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    expect(screen.getByTestId("vehicle-speed-telemetry")).toHaveTextContent("0 px/s");
    expect(screen.getByTestId("vehicle-acceleration-telemetry")).toHaveTextContent(
      "120 px/s²",
    );
    expect(screen.getByTestId("vehicle-heading-telemetry")).toHaveTextContent("0°");
    expect(screen.getByTestId("vehicle-position-telemetry")).toHaveTextContent(
      "X: 400 | Y: 600",
    );
    expect(screen.getByTestId("road-status-telemetry")).toHaveTextContent("On road");
  });

  it("renders canvas diagnostics in the performance tab", async () => {
    const user = userEvent.setup();

    render(
      <DashboardPanel
        status="idle"
        simulationTimeSeconds={0}
        fps={60}
        vehicleSpeed={0}
        vehicleAcceleration={120}
        steeringAngle={0}
        vehiclePositionX={400}
        vehiclePositionY={600}
        vehicleHeading={0}
        roadDepartureWarning={false}
        canvasDiagnostics={{
          width: 1280,
          height: 720,
          pixelRatio: 2,
          bufferWidth: 2560,
          bufferHeight: 1440,
        }}
      />,
    );

    await user.click(screen.getByRole("tab", { name: "Performance" }));

    expect(screen.getByRole("tab", { name: "Performance" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    expect(screen.getByText("Frame Time")).toBeInTheDocument();
    expect(screen.getByText("Canvas")).toBeInTheDocument();
    expect(screen.getByText("1280 × 720")).toBeInTheDocument();
    expect(screen.getByText("Buffer")).toBeInTheDocument();
    expect(screen.getByText("2560 × 1440")).toBeInTheDocument();
    expect(screen.getByText("DPR")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("renders AI telemetry placeholders in the AI tab", async () => {
    const user = userEvent.setup();

    renderDashboard();

    await user.click(screen.getByRole("tab", { name: "AI" }));

    expect(screen.getByText("AI Decision")).toBeInTheDocument();
    expect(screen.getByText("Sensor Status")).toBeInTheDocument();
    expect(screen.getByText("Destination Status")).toBeInTheDocument();

    expect(screen.getByText("Waiting for simulation")).toBeInTheDocument();
    expect(screen.getByText("Not connected")).toBeInTheDocument();
  });

  it("renders debug telemetry placeholders in the debug tab", async () => {
    const user = userEvent.setup();

    renderDashboard();

    await user.click(screen.getByRole("tab", { name: "Debug" }));

    expect(screen.getByTestId("vehicle-steering-telemetry")).toHaveTextContent("0°");
    expect(screen.getByText("Collision Count")).toBeInTheDocument();
    expect(screen.getByText("Lane")).toBeInTheDocument();
    expect(screen.getByText("Camera")).toBeInTheDocument();
    expect(screen.getByText("Offsets")).toBeInTheDocument();
  });
});
