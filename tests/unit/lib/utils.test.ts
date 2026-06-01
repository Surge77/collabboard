import { describe, expect, it } from 'vitest';

import { formatRelativeTime, truncate } from '@/lib/utils';

describe('formatRelativeTime', () => {
  const now = new Date('2026-06-01T12:00:00Z');

  it('returns "just now" for sub-minute differences', () => {
    expect(formatRelativeTime(new Date('2026-06-01T11:59:30Z'), now)).toBe('just now');
  });

  it('returns minutes for sub-hour differences', () => {
    expect(formatRelativeTime(new Date('2026-06-01T11:45:00Z'), now)).toBe('15m ago');
  });

  it('returns hours for sub-day differences', () => {
    expect(formatRelativeTime(new Date('2026-06-01T09:00:00Z'), now)).toBe('3h ago');
  });

  it('returns days for differences under a week', () => {
    expect(formatRelativeTime(new Date('2026-05-30T12:00:00Z'), now)).toBe('2d ago');
  });

  it('falls back to a locale date beyond a week', () => {
    const old = new Date('2026-05-01T12:00:00Z');
    expect(formatRelativeTime(old, now)).toBe(old.toLocaleDateString());
  });
});

describe('truncate', () => {
  it('returns the value unchanged when within the limit', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('truncates and appends an ellipsis when over the limit', () => {
    expect(truncate('hello world', 5)).toBe('hello…');
  });

  it('returns an empty string for a non-positive max', () => {
    expect(truncate('hello', 0)).toBe('');
  });
});
