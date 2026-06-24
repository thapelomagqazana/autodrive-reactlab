import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TelemetryCard } from "./TelemetryCard";

describe("TelemetryCard", () => {
  it("renders label and value", () => {
    render(<TelemetryCard label="Vehicle Speed" value="--" isPlaceholder />);

    expect(screen.getByText("Vehicle Speed")).toBeInTheDocument();
    expect(screen.getByText("--")).toBeInTheDocument();
  });

  it("renders live telemetry values", () => {
    render(<TelemetryCard label="FPS" value="60" />);

    expect(screen.getByText("FPS")).toBeInTheDocument();
    expect(screen.getByText("60")).toBeInTheDocument();
  });
});