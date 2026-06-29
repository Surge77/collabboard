import { Redis } from '@upstash/redis';

// Server-only by usage: imported solely by API route handlers (the AI routes),
// so the @upstash/redis import never reaches the client bundle. The env vars are
// non-public secrets, so the Redis client is only ever constructed server-side.

interface Bucket {
  count: number;
  resetAt: number;
}

// In-memory fixed-window limiter. Per-instance only (resets on cold start, no
// cross-instance protection) — used as the fallback when Upstash is not
// configured (local dev, CI) and as a degraded path if Upstash is unreachable.
const buckets = new Map<string, Bucket>();

function inMemoryRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) return false;

  bucket.count += 1;
  return true;
}

// Resolved once: a Redis client when both Upstash env vars are present, else
// null (fall back to in-memory). `undefined` means "not yet resolved".
let redisClient: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redisClient !== undefined) return redisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  redisClient = url && token ? new Redis({ url, token }) : null;
  return redisClient;
}

// Atomic fixed-window: INCR the counter and, only on the first hit of the
// window, set its TTL — in a single server-side script so the two operations
// cannot be split across round-trips (a failed PEXPIRE after a succeeded INCR
// would otherwise leave a TTL-less key that locks the user out forever).
const FIXED_WINDOW_SCRIPT = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end
return count`;

// Distributed fixed-window limiter, cross-instance because the counter lives in
// Upstash. Mirrors the in-memory window semantics so the (key, limit, windowMs)
// contract is unchanged for callers.
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const redis = getRedis();
  // Upstash not configured (local dev, CI): the in-memory limiter is the
  // intended backend, so this is not a degraded path.
  if (!redis) return inMemoryRateLimit(key, limit, windowMs);

  try {
    const count = await redis.eval<[number], number>(FIXED_WINDOW_SCRIPT, [key], [windowMs]);
    return count <= limit;
  } catch {
    // Upstash IS configured but unreachable: fail closed. Degrading to the
    // per-instance in-memory limiter here would let a user multiply their quota
    // by the number of warm serverless instances against the cost-bearing AI
    // endpoints, so denying is the safe default during an outage.
    console.error('[rate-limit] Upstash unreachable; denying request');
    return false;
  }
}

// Test helper — clears the in-memory windows so cases stay isolated.
export function resetRateLimits(): void {
  buckets.clear();
}
