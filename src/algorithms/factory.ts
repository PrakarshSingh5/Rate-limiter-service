import { RateLimiter, AlgorithmType } from './types';
import { TokenBucketLimiter } from './token-bucket';
import { FixedWindowLimiter } from './fixed-window';
import { SlidingWindowLimiter } from './sliding-window';
import { Storage } from '../storage/types';

/**
 * Factory for creating rate limiter instances
 */
export class AlgorithmFactory {
  private static instances: Map<AlgorithmType, RateLimiter> = new Map();

  /**
   * Get or create a rate limiter instance for the specified algorithm
   */
  static get(algorithm: AlgorithmType, storage: Storage): RateLimiter {
    if (!this.instances.has(algorithm)) {
      this.instances.set(algorithm, this.create(algorithm, storage));
    }
    return this.instances.get(algorithm)!;
  }

  /**
   * Create a new rate limiter instance
   */
  private static create(algorithm: AlgorithmType, storage: Storage): RateLimiter {
    switch (algorithm) {
      case 'token_bucket':
        return new TokenBucketLimiter(storage);
      case 'fixed_window':
        return new FixedWindowLimiter(storage);
      case 'sliding_window':
        return new SlidingWindowLimiter(storage);
      default:
        throw new Error(`Unknown algorithm: ${algorithm}`);
    }
  }

  /**
   * Clear all cached instances (useful for testing)
   */
  static clear(): void {
    this.instances.clear();
  }
}
