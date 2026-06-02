import { afterEach, describe, expect, it, vi } from 'vitest';

import { rateLimit, resetRateLimits } from '@/lib/rate-limit';

afterEach(() => {
  resetRateLimits();
  vi.useRealTimers();
});

describe('rateLimit', () => {
  it('allows up to the limit then blocks', () => {
    expect(rateLimit('k', 3, 10_000)).toBe(true);
    expect(rateLimit('k', 3, 10_000)).toBe(true);
    expect(rateLimit('k', 3, 10_000)).toBe(true);
    expect(rateLimit('k', 3, 10_000)).toBe(false);
  });

  it('tracks each key independently', () => {
    expect(rateLimit('a', 1, 10_000)).toBe(true);
    expect(rateLimit('b', 1, 10_000)).toBe(true);
    expect(rateLimit('a', 1, 10_000)).toBe(false);
  });

  it('resets after the window elapses', () => {
    vi.useFakeTimers();
    expect(rateLimit('w', 1, 1000)).toBe(true);
    expect(rateLimit('w', 1, 1000)).toBe(false);
    vi.advanceTimersByTime(1001);
    expect(rateLimit('w', 1, 1000)).toBe(true);
  });
});
