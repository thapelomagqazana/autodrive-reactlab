/**
 * Component tests for ToggleButton.
 *
 * These tests validate user-event setup and user-driven interaction behavior.
 */

import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "../tests/test-utils";
import { ToggleButton } from "./ToggleButton";

describe("ToggleButton", () => {
  it("renders the disabled text state", () => {
    render(<ToggleButton label="Sensors" isEnabled={false} onToggle={() => {}} />);

    expect(screen.getByRole("button", { name: /sensors: off/i })).toBeInTheDocument();
  });

  it("calls onToggle when clicked", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    render(<ToggleButton label="Sensors" isEnabled={false} onToggle={onToggle} />);

    await user.click(screen.getByRole("button", { name: /sensors: off/i }));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("exposes aria-pressed state", () => {
    render(<ToggleButton label="Debug" isEnabled={true} onToggle={() => {}} />);

    expect(screen.getByRole("button", { name: /debug: on/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});