import { Request, Response, NextFunction } from 'express';
import { RateLimiterClient, CheckRequest } from '../../client/rest-client';

export interface ExpressMiddlewareOptions {
  /**
   * Rate limiter service URL
   * @default 'http://localhost:3000'
   */
  serviceUrl?: string;

  /**
   * Function to extract the key from the request (e.g., user ID, IP)
   */
  keyExtractor?: (req: Request) => string;

  /**
   * Rate limit algorithm to use
   * @default 'token_bucket'
   */
  algorithm?: 'token_bucket' | 'fixed_window' | 'sliding_window';

  /**
   * Maximum number of requests allowed
   */
  limit: number;

  /**
   * Time window in seconds
   */
  window: number;

  /**
   * Optional rule ID to use instead of inline configuration
   */
  ruleId?: string;

  /**
   * Custom error handler
   */
  onRateLimitExceeded?: (req: Request, res: Response, retryAfter: number) => void;

  /**
   * Whether to fail open (allow requests) on errors
   * @default true
   */
  failOpen?: boolean;
}

/**
 * Creates an Express middleware for rate limiting
 * 
 * @example
 * ```typescript
 * import express from 'express';
 * import { createExpressMiddleware } from '@your-scope/rate-limiter-service';
 * 
 * const app = express();
 * 
 * app.use(createExpressMiddleware({
 *   limit: 100,
 *   window: 3600,
 *   keyExtractor: (req) => req.user?.id || req.ip,
 * }));
 * ```
 */
export function createExpressMiddleware(options: ExpressMiddlewareOptions) {
  const {
    serviceUrl = 'http://localhost:3000',
    keyExtractor = (req) => req.ip || 'anonymous',
    algorithm = 'token_bucket',
    limit,
    window,
    ruleId,
    onRateLimitExceeded,
    failOpen = true,
  } = options;

  const client = new RateLimiterClient(serviceUrl);

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = keyExtractor(req);
      const endpoint = req.path;

      const checkRequest: CheckRequest = {
        key,
        endpoint,
        algorithm,
        limit,
        window,
        ruleId,
      };

      const result = await client.check(checkRequest);

      // Set rate limit headers
      res.set('X-RateLimit-Limit', String(result.limit));
      res.set('X-RateLimit-Remaining', String(result.remaining));
      res.set('X-RateLimit-Reset', result.resetAt);

      if (!result.allowed) {
        if (onRateLimitExceeded) {
          return onRateLimitExceeded(req, res, result.retryAfter || 0);
        }

        res.set('Retry-After', String(result.retryAfter || 0));
        return res.status(429).json({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded',
          retryAfter: result.retryAfter,
          limit: result.limit,
          resetAt: result.resetAt,
        });
      }

      next();
    } catch (error) {
      if (failOpen) {
        // Fail open: allow the request to proceed
        console.error('Rate limiter error (failing open):', error);
        next();
      } else {
        // Fail closed: reject the request
        next(error);
      }
    }
  };
}
