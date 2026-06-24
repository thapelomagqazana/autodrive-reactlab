/**
 * Component tests for StatusBadge.
 *
 * These tests validate the React Testing Library setup, jest-dom matchers,
 * accessible queries, and deterministic component rendering.
 */

import { describe, expect, it } from "vitest";
import { render, screen } from "../tests/test-utils";
import { StatusBadge, type StatusBadgeStatus } from "./StatusBadge";

describe("StatusBadge", () => {
  it("renders the idle state", () => {
    render(<StatusBadge status="idle" />);

    expect(screen.getByLabelText("Simulation status")).toHaveTextContent("Idle");
  });

  it("renders the running state", () => {
    render(<StatusBadge status="running" />);

    expect(screen.getByLabelText("Simulation status")).toHaveTextContent("Running");
  });

  it("renders the paused state", () => {
    render(<StatusBadge status="paused" />);

    expect(screen.getByLabelText("Simulation status")).toHaveTextContent("Paused");
  });

  it.each<StatusBadgeStatus>(["idle", "running", "paused"])(
    "renders accessible output for %s status",
    (status) => {
      render(<StatusBadge status={status} />);

      expect(screen.getByLabelText("Simulation status")).toBeInTheDocument();
    },
  );
});
