/**
 * Formats elapsed simulation time from seconds into HH:MM:SS.mmm.
 *
 * This is simulation time, not system-clock time.
 */
export function formatElapsedTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "00:00:00.000";
  }

  const totalMilliseconds = Math.floor(seconds * 1000);

  const milliseconds = totalMilliseconds % 1000;
  const totalSeconds = Math.floor(totalMilliseconds / 1000);
  const displaySeconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const displayMinutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);

  return `${String(hours).padStart(2, "0")}:${String(displayMinutes).padStart(
    2,
    "0",
  )}:${String(displaySeconds).padStart(2, "0")}.${String(milliseconds).padStart(
    3,
    "0",
  )}`;
}