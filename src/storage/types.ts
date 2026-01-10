import Redis from 'ioredis';

/**
 * Storage interface for rate limiter state
 */
export interface Storage {
  /**
   * Get Redis client instance
   */
  getClient(): Redis;

  /**
   * Execute a Lua script atomically
   */
  evalScript(script: string, keys: string[], args: (string | number)[]): Promise<any>;

  /**
   * Get a value from Redis
   */
  get(key: string): Promise<string | null>;

  /**
   * Set a value in Redis with optional TTL
   */
  set(key: string, value: string, ttl?: number): Promise<void>;

  /**
   * Delete a key from Redis
   */
  del(key: string): Promise<void>;

  /**
   * Increment a counter
   */
  incr(key: string): Promise<number>;

  /**
   * Set expiry on a key
   */
  expire(key: string, seconds: number): Promise<void>;

  /**
   * Get time to live for a key
   */
  ttl(key: string): Promise<number>;

  /**
   * Close the connection
   */
  close(): Promise<void>;
}
