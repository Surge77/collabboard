import { describe, expect, it } from 'vitest';

import { formatEdited } from '@/lib/format-date';

describe('formatEdited', () => {
  it('formats in UTC so server and client render the same text', () => {
    expect(formatEdited('2026-06-22T23:30:00.000Z')).toBe('Jun 22, 2026');
  });

  it('is stable regardless of the host time zone', () => {
    expect(formatEdited('2026-01-01T00:00:00.000Z')).toBe('Jan 1, 2026');
  });
});
