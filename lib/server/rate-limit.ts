// Best effort fixed window rate limiter. State lives in memory per server
// instance, so on Vercel it slows abuse rather than stopping it outright.
// Keys are held only in memory for the window and are never stored.

interface Window {
  readonly startedAt: number;
  readonly count: number;
}

export interface RateLimiter {
  /** Returns true if the call is allowed. */
  check(key: string, nowMs: number): boolean;
}

export function createRateLimiter(limit: number, windowMs: number): RateLimiter {
  let windows = new Map<string, Window>();

  return {
    check(key, nowMs) {
      const current = windows.get(key);
      const fresh = !current || nowMs - current.startedAt >= windowMs;
      const next: Window = fresh
        ? { startedAt: nowMs, count: 1 }
        : { startedAt: current.startedAt, count: current.count + 1 };

      // Drop expired entries now and then so memory stays bounded.
      if (windows.size > 5000) {
        windows = new Map([...windows].filter(([, w]) => nowMs - w.startedAt < windowMs));
      }
      windows.set(key, next);
      return next.count <= limit;
    },
  };
}

/** Client key for rate limiting only. Never logged or persisted. */
export function clientKey(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}
