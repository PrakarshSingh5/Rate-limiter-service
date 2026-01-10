import { RateLimiter } from './types';
import { CheckResult } from '../models/result';
import { Storage } from '../storage/types';

/**
 * Sliding Window Algorithm
 * 
 * More accurate than fixed window, prevents boundary gaming.
 * Uses weighted combination of current and previous windows.
 */
export class SlidingWindowLimiter implements RateLimiter {
  constructor(private storage: Storage) {}

  async check(key: string, limit: number, window: number): Promise<CheckResult> {
    const now = Date.now();
    const currentWindow = Math.floor(now / (window * 1000)) * (window * 1000);
    const previousWindow = currentWindow - (window * 1000);
    
    const currentKey = `rl:sliding_window:${key}:${currentWindow}`;
    const previousKey = `rl:sliding_window:${key}:${previousWindow}`;

    // Lua script for sliding window calculation
    const script = `
      local current_key = KEYS[1]
      local previous_key = KEYS[2]
      local limit = tonumber(ARGV[1])
      local window = tonumber(ARGV[2])
      local now = tonumber(ARGV[3])
      local current_window = tonumber(ARGV[4])
      
      local current_count = tonumber(redis.call('GET', current_key) or 0)
      local previous_count = tonumber(redis.call('GET', previous_key) or 0)
      
      -- Calculate position in current window (0 to 1)
      local elapsed = (now - current_window) / (window * 1000)
      
      -- Weighted count from previous window
      local weighted_previous = previous_count * (1 - elapsed)
      
      -- Total estimated count
      local estimated_count = weighted_previous + current_count
      
      local allowed = 0
      local new_count = current_count
      
      if estimated_count < limit then
        new_count = redis.call('INCR', current_key)
        redis.call('EXPIRE', current_key, window * 2)
        allowed = 1
      end
      
      return {allowed, math.floor(estimated_count), new_count}
    `;

    const result = await this.storage.evalScript(
      script,
      [currentKey, previousKey],
      [limit, window, now, currentWindow]
    ) as [number, number, number];

    const [allowed, estimatedCount] = result;
    const remaining = Math.max(0, limit - estimatedCount);
    const resetAt = new Date(currentWindow + window * 1000);
    const retryAfter = allowed === 0 ? Math.ceil((resetAt.getTime() - now) / 1000) : undefined;

    return {
      allowed: allowed === 1,
      limit,
      remaining,
      resetAt,
      retryAfter,
      currentUsage: estimatedCount,
    };
  }
}
