/**
 * Component tests for ControlsPanel.
 *
 * These tests verify accessible rendering and safe interaction behavior
 * without depending on simulation engine implementation.
 */

import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "../tests/test-utils";
import { ControlsPanel } from "./ControlsPanel";

describe("ControlsPanel", () => {
  it("renders required control buttons", () => {
    render(<ControlsPanel />);

    expect(screen.getByRole("button", { name: "Start" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sensors: On" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Debug: Off" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Foundation preview" }),
    ).toBeInTheDocument();
  });

  it("calls lifecycle handlers when buttons are clicked", async () => {
    const user = userEvent.setup();

    const onStart = vi.fn();
    const onPause = vi.fn();
    const onReset = vi.fn();

    render(
      <ControlsPanel onStart={onStart} onPause={onPause} onReset={onReset} />,
    );

    await user.click(screen.getByRole("button", { name: "Start" }));
    await user.click(screen.getByRole("button", { name: "Pause" }));
    await user.click(screen.getByRole("button", { name: "Reset" }));

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onPause).toHaveBeenCalledTimes(1);
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("calls configuration handlers when toggle controls are clicked", async () => {
    const user = userEvent.setup();

    const onToggleSensors = vi.fn();
    const onToggleDebugMode = vi.fn();
    const onSelectScenario = vi.fn();

    render(
        <ControlsPanel
        onToggleSensors={onToggleSensors}
        onToggleDebugMode={onToggleDebugMode}
        onSelectScenario={onSelectScenario}
        />,
    );

    await user.click(screen.getByRole("button", { name: "Sensors: On" }));
    await user.click(screen.getByRole("button", { name: "Debug: Off" }));
    await user.click(
        screen.getByRole("button", { name: "Foundation preview" }),
    );

    expect(onToggleSensors).toHaveBeenCalledTimes(1);
    expect(onToggleDebugMode).toHaveBeenCalledTimes(1);
    expect(onSelectScenario).toHaveBeenCalledTimes(1);
  });

  it("renders safely without handlers", async () => {
    const user = userEvent.setup();

    render(<ControlsPanel />);

    await user.click(screen.getByRole("button", { name: "Start" }));
    await user.click(screen.getByRole("button", { name: "Pause" }));
    await user.click(screen.getByRole("button", { name: "Reset" }));

    expect(screen.getByRole("button", { name: "Start" })).toBeInTheDocument();
  });

  it("reflects toggle state using accessible pressed state", () => {
    render(<ControlsPanel isSensorsVisible={false} isDebugModeEnabled={true} />);

    expect(screen.getByRole("button", { name: "Sensors: Off" })).toHaveAttribute(
        "aria-pressed",
        "false",
    );

    expect(screen.getByRole("button", { name: "Debug: On" })).toHaveAttribute(
        "aria-pressed",
        "true",
    );
  });
});