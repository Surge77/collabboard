const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 86_400_000;

/**
 * Format a timestamp as a short relative string ("just now", "5m ago",
 * "3h ago", "2d ago"). Falls back to a locale date for anything older than a
 * week. Used for board "last edited" labels.
 */
export function formatRelativeTime(date: Date, now: Date = new Date()): string {
  const diff = now.getTime() - date.getTime();

  if (diff < MS_PER_MINUTE) return 'just now';
  if (diff < MS_PER_HOUR) return `${Math.floor(diff / MS_PER_MINUTE)}m ago`;
  if (diff < MS_PER_DAY) return `${Math.floor(diff / MS_PER_HOUR)}h ago`;
  if (diff < MS_PER_DAY * 7) return `${Math.floor(diff / MS_PER_DAY)}d ago`;

  return date.toLocaleDateString();
}

/** Truncate a string to `max` characters, appending an ellipsis when cut. */
export function truncate(value: string, max: number): string {
  if (max <= 0) return '';
  if (value.length <= max) return value;
  return `${value.slice(0, max).trimEnd()}…`;
}
