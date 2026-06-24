/**
 * Store-connected controls tests.
 *
 * These tests verify the real Zustand lifecycle wiring without involving
 * requestAnimationFrame or the game loop.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { useSimulationStore } from "../store";
import { ControlsPanelContainer } from "./ControlsPanelContainer";

function resetStore() {
  useSimulationStore.setState({
    status: "idle",
    telemetry: {
      simulationTimeSeconds: 0,
      fps: 0,
    },
    ui: {
      isDebugModeEnabled: false,
      areSensorsVisible: true,
    },
  });
}

describe("ControlsPanelContainer", () => {
  beforeEach(() => {
    resetStore();
  });

  it("starts, pauses, and resets the simulation through Zustand", async () => {
    const user = userEvent.setup();

    render(<ControlsPanelContainer />);

    await user.click(screen.getByRole("button", { name: "Start" }));
    expect(useSimulationStore.getState().status).toBe("running");

    await user.click(screen.getByRole("button", { name: "Pause" }));
    expect(useSimulationStore.getState().status).toBe("paused");

    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(useSimulationStore.getState().status).toBe("idle");
  });

  it("updates button states from Zustand status", async () => {
    const user = userEvent.setup();

    render(<ControlsPanelContainer />);

    expect(screen.getByRole("button", { name: "Start" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Pause" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Start" }));

    expect(screen.getByRole("button", { name: "Start" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Pause" })).toBeEnabled();
  });
});