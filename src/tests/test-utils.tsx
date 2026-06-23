/**
 * Shared React Testing Library utilities.
 *
 * Import `render` from this file instead of importing directly from
 * `@testing-library/react`.
 */

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
  type RenderOptions,
} from "@testing-library/react";
import type { ReactElement } from "react";

/**
 * Renders React components using the project's standard test renderer.
 *
 * @param ui - React element under test.
 * @param options - Optional React Testing Library render options.
 * @returns React Testing Library render result.
 */
function customRender(ui: ReactElement, options?: RenderOptions) {
  return render(ui, options);
}

export { cleanup, customRender as render, fireEvent, screen, waitFor, within };
export type { RenderOptions };