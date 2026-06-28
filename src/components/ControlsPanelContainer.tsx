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
  useSimulationCameraMode,
  useSimulationStatus,
  useStartSimulation,
  useToggleCameraMode,
} from "../store";
import { ControlsPanel } from "./ControlsPanel";

export function ControlsPanelContainer() {
  const status = useSimulationStatus();
  const startSimulation = useStartSimulation();
  const pauseSimulation = usePauseSimulation();
  const resetSimulation = useResetSimulation();
  const cameraMode = useSimulationCameraMode();
  const toggleCameraMode = useToggleCameraMode();

  return (
    <ControlsPanel
      status={status}
      cameraMode={cameraMode}
      onStart={startSimulation}
      onPause={pauseSimulation}
      onReset={resetSimulation}
      onToggleCameraMode={toggleCameraMode}
    />
  );
}
