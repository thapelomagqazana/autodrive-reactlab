import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ControlsPanel } from "./ControlsPanel";
import { DEFAULT_SENSOR_CONFIG } from "../simulation/sensors/sensorModel";

function renderControlsPanel(
  overrides: Partial<React.ComponentProps<typeof ControlsPanel>> = {},
) {
  return render(
    <ControlsPanel
      status="idle"
      cameraMode="fixed"
      sensorConfig={DEFAULT_SENSOR_CONFIG}
      isDebugModeEnabled={false}
      areSensorsVisible={true}
      {...overrides}
    />,
  );
}

describe("ControlsPanel", () => {
  it("renders lifecycle buttons", () => {
    renderControlsPanel({ status: "idle", cameraMode: "fixed" });

    expect(screen.getByRole("button", { name: "Start" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Pause" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Reset" })).toBeVisible();
  });

  it("uses idle button state rules", () => {
    renderControlsPanel({ status: "idle", cameraMode: "fixed" });

    expect(screen.getByRole("button", { name: "Start" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Pause" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Reset" })).toBeEnabled();
  });

  it("uses running button state rules", () => {
    renderControlsPanel({ status: "running", cameraMode: "fixed" });

    expect(screen.getByRole("button", { name: "Start" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Pause" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Reset" })).toBeEnabled();
  });

  it("uses paused button state rules", () => {
    renderControlsPanel({ status: "paused", cameraMode: "fixed" });

    expect(screen.getByRole("button", { name: "Start" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Pause" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Reset" })).toBeEnabled();
  });

  it("calls handlers for enabled controls", async () => {
    const user = userEvent.setup();

    const onStart = vi.fn();
    const onReset = vi.fn();

    renderControlsPanel({ status: "idle", cameraMode: "fixed", onStart, onReset });

    await user.click(screen.getByRole("button", { name: "Start" }));
    await user.click(screen.getByRole("button", { name: "Reset" }));

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("does not call Start while running because the button is disabled", async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();

    renderControlsPanel({ status: "running", onStart, cameraMode: "fixed" });

    await user.click(screen.getByRole("button", { name: "Start" }));

    expect(onStart).not.toHaveBeenCalled();
  });

  it("does not call Pause while idle because the button is disabled", async () => {
    const user = userEvent.setup();
    const onPause = vi.fn();

    renderControlsPanel({ status: "idle", onPause, cameraMode: "fixed" });

    await user.click(screen.getByRole("button", { name: "Pause" }));

    expect(onPause).not.toHaveBeenCalled();
  });
});

it("renders sensor controls", () => {
  renderControlsPanel();

  expect(screen.getByText("Sensor Controls")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Sensors: Enabled" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Debug Mode: Hidden" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Sensor Overlay: Shown" })).toBeVisible();
  expect(screen.getByText("Ray Count")).toBeInTheDocument();
  expect(screen.getByText("7")).toBeInTheDocument();
  expect(screen.getByText("Sensor Range")).toBeInTheDocument();
});
