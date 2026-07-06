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
  useSimulationUiPreferences,
  useToggleDebugMode,
  useToggleSensorsVisibility,
  useSimulationSensorConfig,
  useToggleSensorsEnabled,
  useIncreaseSensorRayCount,
  useDecreaseSensorRayCount,
  useIncreaseSensorRange,
  useDecreaseSensorRange,
  useResetSensorSettings,
} from "../store";
import { ControlsPanel } from "./ControlsPanel";

export function ControlsPanelContainer() {
  const status = useSimulationStatus();
  const startSimulation = useStartSimulation();
  const pauseSimulation = usePauseSimulation();
  const resetSimulation = useResetSimulation();
  const cameraMode = useSimulationCameraMode();
  const toggleCameraMode = useToggleCameraMode();

  const ui = useSimulationUiPreferences();
  const sensorConfig = useSimulationSensorConfig();

  return (
    <ControlsPanel
      status={status}
      cameraMode={cameraMode}
      sensorConfig={sensorConfig}
      isDebugModeEnabled={ui.isDebugModeEnabled}
      areSensorsVisible={ui.areSensorsVisible}
      onStart={startSimulation}
      onPause={pauseSimulation}
      onReset={resetSimulation}
      onToggleCameraMode={toggleCameraMode}
      onToggleDebugMode={useToggleDebugMode()}
      onToggleSensorsVisibility={useToggleSensorsVisibility()}
      onToggleSensorsEnabled={useToggleSensorsEnabled()}
      onIncreaseSensorRayCount={useIncreaseSensorRayCount()}
      onDecreaseSensorRayCount={useDecreaseSensorRayCount()}
      onIncreaseSensorRange={useIncreaseSensorRange()}
      onDecreaseSensorRange={useDecreaseSensorRange()}
      onResetSensorSettings={useResetSensorSettings()}
    />
  );
}
