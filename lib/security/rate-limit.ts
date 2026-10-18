interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Garbage collect expired buckets every 5 minutes
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

// Prevent cleanup interval from blocking process termination
if (cleanupInterval && typeof cleanupInterval.unref === 'function') {
  cleanupInterval.unref();
}

export interface RateLimitOptions {
  windowMs: number;
  maxAttempts: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetSeconds: number;
  source?: 'memory' | 'distributed' | 'fallback';
}

/**
 * Sliding-window in-memory rate limiter with fail-safe bounds.
 * Tracks client requests by IP or user identity to protect against brute-force attacks,
 * credential stuffing, and volumetric request floods.
 *
 * @param key - The unique tracking identifier (e.g. `login:ip:192.168.1.1` or `login:account:EMP-0001`)
 * @param options - Configuration options
 * @param options.windowMs - Sliding window duration in milliseconds (default: 60,000ms / 1 min)
 * @param options.maxAttempts - Maximum requests permitted within the window (default: 5)
 *
 * @returns {RateLimitResult} Object containing allowed status, remaining attempts, and reset countdown
 */
export function checkRateLimit(
  key: string,
  options: RateLimitOptions = { windowMs: 60 * 1000, maxAttempts: 5 }
): RateLimitResult {
  const now = Date.now();

  // Bounded store protection against memory exhaustion
  if (rateLimitStore.size > 10000) {
    for (const [k, r] of rateLimitStore.entries()) {
      if (now > r.resetAt) {
        rateLimitStore.delete(k);
      }
    }
  }

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
      source: 'memory',
    };
  }

  if (record.count >= options.maxAttempts) {
    const resetSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      resetSeconds,
      source: 'memory',
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, options.maxAttempts - record.count),
    resetSeconds: Math.ceil((record.resetAt - now) / 1000),
    source: 'memory',
  };
}

/**
 * Distributed rate limiter for multi-instance deployments.
 * If external shared storage (e.g., Upstash / Redis) is configured via environment variables,
 * coordinates across instances. If unavailable or unconfigured, it fails safely to the
 * in-memory rate limiter so that authentication and ingestion remain protected and operational.
 */
export async function checkRateLimitDistributed(
  key: string,
  options: RateLimitOptions = { windowMs: 60 * 1000, maxAttempts: 5 }
): Promise<RateLimitResult> {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (upstashUrl && upstashToken) {
    try {
      const redisKey = `ratelimit:${key}`;
      const res = await fetch(`${upstashUrl}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${upstashToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          ['INCR', redisKey],
          ['TTL', redisKey],
        ]),
        signal: AbortSignal.timeout(1500), // Strict 1.5s timeout for fail-safe fallback
      });

      if (res.ok) {
        const [incrRes, ttlRes] = await res.json();
        const currentCount = incrRes?.result || 1;
        let ttl = ttlRes?.result || Math.ceil(options.windowMs / 1000);

        if (currentCount === 1) {
          // Set TTL on newly created key
          const windowSeconds = Math.ceil(options.windowMs / 1000);
          await fetch(`${upstashUrl}/expire/${encodeURIComponent(redisKey)}/${windowSeconds}`, {
            headers: { Authorization: `Bearer ${upstashToken}` },
          }).catch(() => {});
          ttl = windowSeconds;
        }

        const allowed = currentCount <= options.maxAttempts;
        return {
          allowed,
          remaining: Math.max(0, options.maxAttempts - currentCount),
          resetSeconds: ttl > 0 ? ttl : Math.ceil(options.windowMs / 1000),
          source: 'distributed',
        };
      }
    } catch (err) {
      console.warn(
        `[RateLimit] Distributed storage error, falling back safely to in-memory store for key "${key}":`,
        err instanceof Error ? err.message : String(err)
      );
    }
  }

  // Fail-safe: Always fall back to in-memory rate limiting
  const localRes = checkRateLimit(key, options);
  return {
    ...localRes,
    source: 'fallback',
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

/**
 * Clears all in-memory rate limit entries.
 * Primarily intended for automated test suites.
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}
