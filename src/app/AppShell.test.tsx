/**
 * Component tests for AppShell.
 *
 * These tests verify that AppShell creates stable semantic regions
 * without depending on simulation implementation details.
 */

import { describe, expect, it } from "vitest";
import { render, screen } from "../tests/test-utils";
import { AppShell } from "./AppShell";

describe("AppShell", () => {
  it("renders all application layout regions", () => {
    render(
      <AppShell
        header={<div>Header region</div>}
        simulation={<div>Simulation region</div>}
        controls={<div>Controls region</div>}
        dashboard={<div>Dashboard region</div>}
      />,
    );

    expect(screen.getByLabelText("Application header")).toBeInTheDocument();
    expect(screen.getByLabelText("Simulation workspace")).toBeInTheDocument();
    expect(screen.getByLabelText("Simulation canvas area")).toBeInTheDocument();
    expect(screen.getByLabelText("Simulation controls")).toBeInTheDocument();
    expect(screen.getByLabelText("Simulation dashboard")).toBeInTheDocument();
  });
});