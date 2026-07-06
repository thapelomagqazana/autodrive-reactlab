import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SensorDebugPanel } from "./SensorDebugPanel";
import type { SensorDebugSummary } from "../simulation/sensors/sensorDebugSummary";

function createSummary(overrides: Partial<SensorDebugSummary> = {}): SensorDebugSummary {
  return {
    status: "Enabled",
    front: {
      group: "front",
      displayDistance: "Clear",
      nearestReading: null,
    },
    left: {
      group: "left",
      displayDistance: "30 px",
      nearestReading: null,
    },
    right: {
      group: "right",
      displayDistance: "No data",
      nearestReading: null,
    },
    nearestDetection: {
      group: "left",
      detectionType: "road-boundary",
      distance: 30,
      displayDistance: "30 px",
    },
    ...overrides,
  };
}

describe("SensorDebugPanel", () => {
  it("renders sensor status and group distances", () => {
    render(<SensorDebugPanel summary={createSummary()} />);

    expect(screen.getByText("Sensors")).toBeInTheDocument();
    expect(screen.getByText("Enabled")).toBeInTheDocument();
    expect(screen.getByText("Clear")).toBeInTheDocument();
    expect(screen.getByText("30 px")).toBeInTheDocument();
    expect(screen.getByText("No data")).toBeInTheDocument();
  });

  it("renders nearest detection", () => {
    render(<SensorDebugPanel summary={createSummary()} />);

    expect(screen.getByText("Left road-boundary at 30 px")).toBeInTheDocument();
  });

  it("renders none when no nearest detection exists", () => {
    render(
      <SensorDebugPanel
        summary={createSummary({
          nearestDetection: null,
        })}
      />,
    );

    expect(screen.getByText("None")).toBeInTheDocument();
  });

  it("renders disabled state safely", () => {
    render(
      <SensorDebugPanel
        summary={createSummary({
          status: "Disabled",
          front: {
            group: "front",
            displayDistance: "Disabled",
            nearestReading: null,
          },
          left: {
            group: "left",
            displayDistance: "Disabled",
            nearestReading: null,
          },
          right: {
            group: "right",
            displayDistance: "Disabled",
            nearestReading: null,
          },
          nearestDetection: null,
        })}
      />,
    );

    expect(screen.getAllByText("Disabled")).toHaveLength(4);
    expect(screen.getByText("None")).toBeInTheDocument();
  });
});
