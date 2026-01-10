import { RateLimiter } from './types';
import { CheckResult } from '../models/result';
import { Storage } from '../storage/types';

/**
 * Token Bucket Algorithm
 * 
 * Allows bursts while maintaining average rate.
 * Tokens are added at a constant rate, requests consume tokens.
 */
export class TokenBucketLimiter implements RateLimiter {
  constructor(private storage: Storage) {}

  async check(key: string, limit: number, window: number): Promise<CheckResult> {
    const now = Date.now();
    const redisKey = `rl:token_bucket:${key}`;
    
    // Lua script for atomic token bucket operation
    const script = `
      local key = KEYS[1]
      local limit = tonumber(ARGV[1])
      local window = tonumber(ARGV[2])
      local now = tonumber(ARGV[3])
      local rate = limit / window
      
      local bucket = redis.call('HMGET', key, 'tokens', 'last_update')
      local tokens = tonumber(bucket[1])
      local last_update = tonumber(bucket[2])
      
      if tokens == nil then
        tokens = limit
        last_update = now
      end
      
      -- Calculate tokens to add based on time elapsed
      local elapsed = (now - last_update) / 1000
      local tokens_to_add = elapsed * rate
      tokens = math.min(limit, tokens + tokens_to_add)
      
      local allowed = 0
      local remaining = tokens
      
      if tokens >= 1 then
        tokens = tokens - 1
        allowed = 1
        remaining = tokens
      end
      
      -- Update bucket state
      redis.call('HMSET', key, 'tokens', tokens, 'last_update', now)
      redis.call('EXPIRE', key, window * 2)
      
      return {allowed, math.floor(remaining), tokens}
    `;

    const result = await this.storage.evalScript(
      script,
      [redisKey],
      [limit, window, now]
    ) as [number, number, number];

    const [allowed, remaining, currentTokens] = result;
    const resetAt = new Date(now + window * 1000);

    return {
      allowed: allowed === 1,
      limit,
      remaining,
      resetAt,
      retryAfter: allowed === 0 ? Math.ceil((1 - currentTokens) / (limit / window)) : undefined,
      currentUsage: limit - remaining,
    };
  }
}
