/**
 * In-memory sliding-window rate limiter. Good enough for a single Node process;
 * swap for Redis/Upstash once the app runs on more than one instance.
 */
interface Bucket {
  windowMs: number;
  hits: number[]; // request timestamps (ms), oldest first
}

const SWEEP_EVERY_MS = 60_000;
const MAX_KEYS = 10_000;

// Survive dev hot-reload so limits don't reset on every edit.
const store = globalThis as unknown as { __amxRateLimit?: { buckets: Map<string, Bucket>; lastSweep: number } };
const state = (store.__amxRateLimit ??= { buckets: new Map(), lastSweep: 0 });

function sweep(now: number) {
  for (const [key, b] of state.buckets) {
    if (!b.hits.length || b.hits[b.hits.length - 1] <= now - b.windowMs) state.buckets.delete(key);
  }
  state.lastSweep = now;
}

/**
 * Records one hit for `key` and reports whether it is within `limit` hits per `windowMs`.
 * `now` is injectable for tests.
 */
export function rateLimit(key: string, limit: number, windowMs: number, now: number = Date.now()): { ok: boolean; retryAfterSec: number } {
  if (now - state.lastSweep > SWEEP_EVERY_MS || state.buckets.size > MAX_KEYS) sweep(now);

  let bucket = state.buckets.get(key);
  if (!bucket) {
    bucket = { windowMs, hits: [] };
    state.buckets.set(key, bucket);
  }
  bucket.windowMs = windowMs;
  const cutoff = now - windowMs;
  while (bucket.hits.length && bucket.hits[0] <= cutoff) bucket.hits.shift();

  if (bucket.hits.length >= limit) {
    const retryAfterSec = Math.max(1, Math.ceil((bucket.hits[0] + windowMs - now) / 1000));
    return { ok: false, retryAfterSec };
  }
  bucket.hits.push(now);
  return { ok: true, retryAfterSec: 0 };
}

/** Test helper: forget every bucket. */
export function resetRateLimits() {
  state.buckets.clear();
  state.lastSweep = 0;
}

/** Best-effort client IP behind a proxy (first x-forwarded-for hop, then x-real-ip). */
export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  if (first) return first;
  const real = req.headers.get("x-real-ip")?.trim();
  return real || "unknown";
}
