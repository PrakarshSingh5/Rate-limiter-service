/**
 * Rate Limiter Service - NPM Package Entry Point
 * 
 * This file exports the main components for use as an npm package.
 * Developers can import and use this library directly in their applications.
 */

// Export client
export { RateLimiterClient, RateLimitError, checkRateLimit } from '../client/rest-client';
export type { CheckRequest, CheckResult, Rule, CreateRuleRequest } from '../client/rest-client';

// Export core services for advanced usage
export { RateLimiterService } from '../services/rate-limiter';
export { RuleService } from '../cache/rule-service';
export { getStorage } from '../storage/redis';

// Export algorithms
export { TokenBucketLimiter } from '../algorithms/token-bucket';
export { FixedWindowLimiter } from '../algorithms/fixed-window';
export { SlidingWindowLimiter } from '../algorithms/sliding-window';

// Export types
export type { RateLimiter } from '../algorithms/types';
export type { Storage } from '../storage/types';

// Export middleware helpers
export { createExpressMiddleware } from './middleware/express';
export { createFastifyPlugin } from './middleware/fastify';

// Export server creation (for those who want to run as a service)
export { createRestServer } from '../api/rest/server';
export { config } from '../config';
