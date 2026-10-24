interface RateLimitRecord {
  timestamps: number[];
}

const memoryStore = new Map<string, RateLimitRecord>();

// Periodically clean up stale rate limit entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of memoryStore.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < 600000);
      if (record.timestamps.length === 0) {
        memoryStore.delete(key);
      }
    }
  }, 300000);
}

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetInSeconds: number;
}

export async function rateLimit(
  key: string,
  options: RateLimitOptions = { limit: 60, windowMs: 60000 }
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = now - options.windowMs;

  let record = memoryStore.get(key);
  if (!record) {
    record = { timestamps: [] };
    memoryStore.set(key, record);
  }

  // Filter out timestamps outside the active sliding window
  record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

  if (record.timestamps.length >= options.limit) {
    const oldest = record.timestamps[0];
    const resetInSeconds = Math.ceil((oldest + options.windowMs - now) / 1000);
    return {
      success: false,
      limit: options.limit,
      remaining: 0,
      resetInSeconds: Math.max(resetInSeconds, 1),
    };
  }

  record.timestamps.push(now);
  const remaining = options.limit - record.timestamps.length;
  const resetInSeconds = Math.ceil(options.windowMs / 1000);

  return {
    success: true,
    limit: options.limit,
    remaining,
    resetInSeconds,
  };
}
