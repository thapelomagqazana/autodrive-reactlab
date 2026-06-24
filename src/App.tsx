/**
 * Root composition for AutoDrive ReactLab.
 */

import { AppShell } from "./app";
import {
  ControlsPanelContainer,
  DashboardPanelContainer,
  Header,
  SimulationCanvas,
} from "./components";

export function App() {
  return (
    <AppShell
      header={<Header />}
      simulation={<SimulationCanvas />}
      controls={<ControlsPanelContainer />}
      dashboard={<DashboardPanelContainer />}
    />
  );
}

export default App;