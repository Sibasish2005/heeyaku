interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Garbage collect expired buckets every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000).unref?.();

export interface RateLimitOptions {
  windowMs: number;
  maxAttempts: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetSeconds: number;
}

/**
 * Sliding-window in-memory rate limiter.
 * Tracks client requests by IP or user identity to protect against brute-force attacks,
 * credential stuffing, and volumetric request floods.
 *
 * @param key - The unique tracking identifier (e.g. `login:ip:192.168.1.1` or `login:account:EMP-0001`)
 * @param options - Configuration options
 * @param options.windowMs - Sliding window duration in milliseconds (default: 60,000ms / 1 min)
 * @param options.maxAttempts - Maximum requests permitted within the window (default: 5)
 *
 * @returns {RateLimitResult} Object containing:
 * - `allowed`: boolean flag indicating whether the current request is within limits
 * - `remaining`: count of remaining attempts available in current window
 * - `resetSeconds`: countdown in seconds until window resets
 */
export function checkRateLimit(
  key: string,
  options: RateLimitOptions = { windowMs: 60 * 1000, maxAttempts: 5 }
): RateLimitResult {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + options.windowMs,
    });
    return {
      allowed: true,
      remaining: options.maxAttempts - 1,
      resetSeconds: Math.ceil(options.windowMs / 1000),
    };
  }

  if (record.count >= options.maxAttempts) {
    const resetSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      resetSeconds,
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, options.maxAttempts - record.count),
    resetSeconds: Math.ceil((record.resetAt - now) / 1000),
  };
}

/**
 * Resets the rate limit counter for a key immediately.
 * Called upon successful authentication to clear previous failed attempts.
 *
 * @param key - The unique tracking identifier to clear
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}
