/**
 * Root composition for AutoDrive ReactLab.
 */

import { AppShell } from "./app";
import { ControlsPanel, DashboardPanel, Header, SimulationCanvas } from "./components";
import {
  usePauseSimulation,
  useResetSimulation,
  useSimulationStatus,
  useSimulationTelemetry,
  useStartSimulation,
} from "./store";

export function App() {
  const status = useSimulationStatus();
  const telemetry = useSimulationTelemetry();

  const startSimulation = useStartSimulation();
  const pauseSimulation = usePauseSimulation();
  const resetSimulation = useResetSimulation();

  return (
    <AppShell
      header={<Header />}
      simulation={<SimulationCanvas />}
      controls={
        <ControlsPanel
          onStart={startSimulation}
          onPause={pauseSimulation}
          onReset={resetSimulation}
          onToggleSensors={() => undefined}
          onToggleDebugMode={() => undefined}
          onSelectScenario={() => undefined}
          selectedScenarioLabel="Foundation preview"
        />
      }
      dashboard={
        <DashboardPanel
          telemetry={{
            simulationTime: `${telemetry.simulationTimeSeconds.toFixed(1)}s`,
            fps: String(telemetry.fps),
            currentDecision: status,
          }}
        />
      }
    />
  );
}

export default App;