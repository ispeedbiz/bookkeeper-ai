/**
 * Simple in-memory rate limiter for API routes.
 * Uses a Map to track request counts per key within sliding windows.
 *
 * Note: This is per-process only. In a multi-instance deployment,
 * use Redis or a similar shared store instead.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

/** Interval for cleaning up expired entries (60 seconds) */
const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

/**
 * Check and consume a rate limit token for the given key.
 * @param key - Unique identifier for the rate limit bucket (e.g., IP address or user ID)
 * @param limit - Maximum number of requests allowed within the window
 * @param windowMs - Time window in milliseconds
 * @returns Object with success status, remaining tokens, and reset timestamp
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number; resetAt: number } {
  const now = Date.now();

  // Periodically clean up expired entries
  if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
    cleanup(now);
    lastCleanup = now;
  }

  const entry = store.get(key);

  // No existing entry or window has expired - start fresh
  if (!entry || now >= entry.resetAt) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { success: true, remaining: limit - 1, resetAt };
  }

  // Within the window - check the limit
  if (entry.count >= limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }

  // Increment and allow
  entry.count += 1;
  const remaining = limit - entry.count;
  return { success: true, remaining, resetAt: entry.resetAt };
}

/**
 * Remove all expired entries from the store.
 */
function cleanup(now: number): void {
  for (const [key, entry] of store) {
    if (now >= entry.resetAt) {
      store.delete(key);
    }
  }
}
