import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { rateLimit, resetRateLimits } from '@/lib/rate-limit';

afterEach(() => {
  resetRateLimits();
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe('rateLimit (in-memory fallback, no Upstash env)', () => {
  it('allows up to the limit then blocks', async () => {
    expect(await rateLimit('k', 3, 10_000)).toBe(true);
    expect(await rateLimit('k', 3, 10_000)).toBe(true);
    expect(await rateLimit('k', 3, 10_000)).toBe(true);
    expect(await rateLimit('k', 3, 10_000)).toBe(false);
  });

  it('tracks each key independently', async () => {
    expect(await rateLimit('a', 1, 10_000)).toBe(true);
    expect(await rateLimit('b', 1, 10_000)).toBe(true);
    expect(await rateLimit('a', 1, 10_000)).toBe(false);
  });

  it('resets after the window elapses', async () => {
    vi.useFakeTimers();
    expect(await rateLimit('w', 1, 1000)).toBe(true);
    expect(await rateLimit('w', 1, 1000)).toBe(false);
    vi.advanceTimersByTime(1001);
    expect(await rateLimit('w', 1, 1000)).toBe(true);
  });
});

describe('rateLimit (Upstash backend)', () => {
  const evalFn = vi.fn();

  beforeEach(() => {
    vi.resetModules();
    evalFn.mockReset();
  });

  // Fresh module per test (resetModules) so the memoized client is rebuilt with
  // the stubbed env and the mocked Redis.
  async function loadWithUpstash() {
    vi.doMock('@upstash/redis', () => ({
      // Regular function, not an arrow: the limiter calls `new Redis(...)` and
      // arrow functions cannot be used as constructors.
      Redis: vi.fn(function Redis() {
        return { eval: evalFn };
      }),
    }));
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://example.upstash.io');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'token');
    return (await import('@/lib/rate-limit')).rateLimit;
  }

  it('allows while the atomic count is within the limit', async () => {
    evalFn.mockResolvedValueOnce(1);
    const limit = await loadWithUpstash();
    expect(await limit('k', 3, 1000)).toBe(true);
    // Atomic script invoked with the key and the window as KEYS/ARGV.
    expect(evalFn).toHaveBeenCalledWith(expect.any(String), ['k'], [1000]);
  });

  it('blocks when the atomic count exceeds the limit', async () => {
    evalFn.mockResolvedValueOnce(4);
    const limit = await loadWithUpstash();
    expect(await limit('k', 3, 1000)).toBe(false);
  });

  it('fails closed (denies) when Upstash is configured but throws', async () => {
    evalFn.mockRejectedValueOnce(new Error('network down'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const limit = await loadWithUpstash();
    expect(await limit('k', 1, 1000)).toBe(false);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
