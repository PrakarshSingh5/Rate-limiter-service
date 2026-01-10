import { RateLimiter } from './types';
import { CheckResult } from '../models/result';
import { Storage } from '../storage/types';

/**
 * Fixed Window Algorithm
 * 
 * Simple counter that resets at fixed intervals.
 * Fast and efficient but can have boundary issues.
 */
export class FixedWindowLimiter implements RateLimiter {
  constructor(private storage: Storage) {}

  async check(key: string, limit: number, window: number): Promise<CheckResult> {
    const now = Date.now();
    const windowStart = Math.floor(now / (window * 1000)) * (window * 1000);
    const redisKey = `rl:fixed_window:${key}:${windowStart}`;

    // Lua script for atomic increment and check
    const script = `
      local key = KEYS[1]
      local limit = tonumber(ARGV[1])
      local window = tonumber(ARGV[2])
      
      local current = redis.call('GET', key)
      
      if current == false then
        current = 0
      else
        current = tonumber(current)
      end
      
      local allowed = 0
      local new_count = current
      
      if current < limit then
        new_count = redis.call('INCR', key)
        redis.call('EXPIRE', key, window)
        allowed = 1
      end
      
      return {allowed, new_count}
    `;

    const result = await this.storage.evalScript(
      script,
      [redisKey],
      [limit, window]
    ) as [number, number];

    const [allowed, currentCount] = result;
    const remaining = Math.max(0, limit - currentCount);
    const resetAt = new Date(windowStart + window * 1000);
    const retryAfter = allowed === 0 ? Math.ceil((resetAt.getTime() - now) / 1000) : undefined;

    return {
      allowed: allowed === 1,
      limit,
      remaining,
      resetAt,
      retryAfter,
      currentUsage: currentCount,
    };
  }
}
