/**
 * Application entry point.
 *
 * The global stylesheet is imported exactly once here so Tailwind utilities
 * are available across the entire React application.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
