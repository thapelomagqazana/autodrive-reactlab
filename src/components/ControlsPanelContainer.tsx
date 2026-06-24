/**
 * ControlsPanelContainer component.
 *
 * Connects the presentational ControlsPanel to the Zustand simulation store.
 *
 * Responsibilities:
 * - Read only lifecycle status from the store.
 * - Read only lifecycle actions from the store.
 * - Pass plain props into ControlsPanel.
 *
 * Non-responsibilities:
 * - No game loop start/stop.
 * - No requestAnimationFrame.
 * - No canvas rendering.
 */

import {
  usePauseSimulation,
  useResetSimulation,
  useSimulationStatus,
  useStartSimulation,
} from "../store";
import { ControlsPanel } from "./ControlsPanel";

export function ControlsPanelContainer() {
  const status = useSimulationStatus();
  const startSimulation = useStartSimulation();
  const pauseSimulation = usePauseSimulation();
  const resetSimulation = useResetSimulation();

  return (
    <ControlsPanel
      status={status}
      onStart={startSimulation}
      onPause={pauseSimulation}
      onReset={resetSimulation}
    />
  );
}
