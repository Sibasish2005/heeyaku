/**
 * Date utility for Indian Standard Time (IST, UTC+05:30) calculations.
 * Avoids server UTC skew where early morning Indian hours are miscalculated as the previous day.
 */

export const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/**
 * Returns the timestamp in milliseconds representing 00:00:00.000 IST of today.
 */
export function getStartOfTodayISTMs(): number {
  const nowMs = Date.now();
  const istDate = new Date(nowMs + IST_OFFSET_MS);
  return (
    Date.UTC(
      istDate.getUTCFullYear(),
      istDate.getUTCMonth(),
      istDate.getUTCDate(),
      0,
      0,
      0,
      0
    ) - IST_OFFSET_MS
  );
}

/**
 * Returns a Date object representing 00:00:00.000 IST of today.
 */
export function getStartOfTodayIST(): Date {
  return new Date(getStartOfTodayISTMs());
}
