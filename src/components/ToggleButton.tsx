/**
 * ToggleButton component.
 *
 * Small reusable component used to verify user-event interaction testing.
 */

export interface ToggleButtonProps {
  /**
   * Visible button label.
   */
  label: string;

  /**
   * Current toggle state.
   */
  isEnabled: boolean;

  /**
   * Called when the user activates the button.
   */
  onToggle: () => void;
}

/**
 * Renders an accessible toggle button.
 */
export function ToggleButton({ label, isEnabled, onToggle }: ToggleButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={isEnabled}
      className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-100"
      onClick={onToggle}
    >
      {label}: {isEnabled ? "On" : "Off"}
    </button>
  );
}