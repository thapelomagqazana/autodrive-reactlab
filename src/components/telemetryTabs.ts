/**
 * Mission telemetry tab definitions.
 *
 * This file centralises the dashboard tab model so the UI, tests,
 * and future telemetry features share one stable source of truth.
 */

export type TelemetryTabId = "vehicle" | "performance" | "ai" | "debug";

export interface TelemetryTabDefinition {
  id: TelemetryTabId;
  label: string;
}

/**
 * Ordered telemetry tabs displayed in the dashboard.
 *
 * Vehicle:
 * - Current driving state.
 *
 * Performance:
 * - Runtime health and canvas diagnostics.
 *
 * AI:
 * - Future autonomous decision-making telemetry.
 *
 * Debug:
 * - Developer-facing diagnostics.
 */
export const TELEMETRY_TABS: readonly TelemetryTabDefinition[] = Object.freeze([
  {
    id: "vehicle",
    label: "Vehicle",
  },
  {
    id: "performance",
    label: "Performance",
  },
  {
    id: "ai",
    label: "AI",
  },
  {
    id: "debug",
    label: "Debug",
  },
]);

/**
 * Default telemetry tab shown on first render.
 */
export const DEFAULT_TELEMETRY_TAB_ID: TelemetryTabId = "vehicle";
