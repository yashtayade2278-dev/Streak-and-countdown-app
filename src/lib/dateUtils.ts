/**
 * Strict Local Calendar Date Math Utilities
 * All operations operate strictly on calendar dates (YYYY-MM-DD) in the user's local timezone,
 * avoiding rolling 24-hour UTC drift or daylight saving errors.
 */

export function padZero(num: number): string {
  return num < 10 ? `0${num}` : `${num}`;
}

/**
 * Returns today's local date as YYYY-MM-DD
 * Allows applying an integer day offset for testing & date-travel simulation.
 */
export function getTodayLocalDate(offsetDays: number = 0): string {
  const now = new Date();
  if (offsetDays !== 0) {
    now.setDate(now.getDate() + offsetDays);
  }
  const year = now.getFullYear();
  const month = padZero(now.getMonth() + 1);
  const day = padZero(now.getDate());
  return `${year}-${month}-${day}`;
}

/**
 * Parse YYYY-MM-DD into a local Date object set to 00:00:00 local time
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

/**
 * Calculates signed calendar days difference: dateB - dateA
 * (e.g. if dateA is 2026-10-10 and dateB is 2026-10-13, returns 3)
 */
export function diffCalendarDays(dateA: string, dateB: string): number {
  const da = parseLocalDate(dateA);
  const db = parseLocalDate(dateB);
  const msPerDay = 1000 * 60 * 60 * 24;
  const utc1 = Date.UTC(da.getFullYear(), da.getMonth(), da.getDate());
  const utc2 = Date.UTC(db.getFullYear(), db.getMonth(), db.getDate());
  return Math.round((utc2 - utc1) / msPerDay);
}

/**
 * Adds an integer number of days to a YYYY-MM-DD string
 */
export function addDays(dateStr: string, days: number): string {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = padZero(d.getMonth() + 1);
  const day = padZero(d.getDate());
  return `${year}-${month}-${day}`;
}

/**
 * Format a YYYY-MM-DD string for human display (e.g. "12 Oct 2026")
 */
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = parseLocalDate(dateStr);
  return d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Friendly relative date label (e.g. "Today", "Yesterday", "Tomorrow", "12 Oct")
 */
export function formatRelativeDate(dateStr: string, today: string): string {
  const diff = diffCalendarDays(today, dateStr);
  if (diff === 0) return 'Today';
  if (diff === -1) return 'Yesterday';
  if (diff === 1) return 'Tomorrow';
  return formatDisplayDate(dateStr);
}

/**
 * Checks if a string is a valid YYYY-MM-DD format
 */
export function isValidDateStr(str: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const [y, m, d] = str.split('-').map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}
