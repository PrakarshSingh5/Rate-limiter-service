import { CheckResult } from '../models/result';

/**
 * Rate limiter algorithm interface
 * All algorithms must implement this interface
 */
export interface RateLimiter {
  /**
   * Check if a request is allowed under the rate limit
   * @param key - Unique identifier for the rate limit (e.g., "user:123", "ip:192.168.1.1")
   * @param limit - Maximum number of requests allowed
   * @param window - Time window in seconds
   * @returns CheckResult with allowed status and metadata
   */
  check(key: string, limit: number, window: number): Promise<CheckResult>;
}

/**
 * Algorithm type
 */
export type AlgorithmType = 'token_bucket' | 'fixed_window' | 'sliding_window';
