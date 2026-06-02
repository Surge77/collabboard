interface Bucket {
  count: number;
  resetAt: number;
}

// In-memory fixed-window limiter. Per-instance only (resets on cold start),
// which is acceptable for a portfolio app; swap for Upstash/Redis if it ever
// needs to hold across serverless instances.
const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
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

// Test helper — clears all windows so cases stay isolated.
export function resetRateLimits(): void {
  buckets.clear();
}
