import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ControlsPanel } from "./ControlsPanel";

describe("ControlsPanel", () => {
  it("renders lifecycle buttons", () => {
    render(<ControlsPanel status="idle" />);

    expect(screen.getByRole("button", { name: "Start" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Pause" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Reset" })).toBeVisible();
  });

  it("uses idle button state rules", () => {
    render(<ControlsPanel status="idle" />);

    expect(screen.getByRole("button", { name: "Start" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Pause" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Reset" })).toBeEnabled();
  });

  it("uses running button state rules", () => {
    render(<ControlsPanel status="running" />);

    expect(screen.getByRole("button", { name: "Start" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Pause" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Reset" })).toBeEnabled();
  });

  it("uses paused button state rules", () => {
    render(<ControlsPanel status="paused" />);

    expect(screen.getByRole("button", { name: "Start" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Pause" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Reset" })).toBeEnabled();
  });

  it("calls handlers for enabled controls", async () => {
    const user = userEvent.setup();

    const onStart = vi.fn();
    const onReset = vi.fn();

    render(<ControlsPanel status="idle" onStart={onStart} onReset={onReset} />);

    await user.click(screen.getByRole("button", { name: "Start" }));
    await user.click(screen.getByRole("button", { name: "Reset" }));

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("does not call Start while running because the button is disabled", async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();

    render(<ControlsPanel status="running" onStart={onStart} />);

    await user.click(screen.getByRole("button", { name: "Start" }));

    expect(onStart).not.toHaveBeenCalled();
  });

  it("does not call Pause while idle because the button is disabled", async () => {
    const user = userEvent.setup();
    const onPause = vi.fn();

    render(<ControlsPanel status="idle" onPause={onPause} />);

    await user.click(screen.getByRole("button", { name: "Pause" }));

    expect(onPause).not.toHaveBeenCalled();
  });
});