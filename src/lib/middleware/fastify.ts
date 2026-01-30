import { FastifyRequest, FastifyReply, FastifyPluginCallback } from 'fastify';
import { RateLimiterClient, CheckRequest } from '../../client/rest-client';

export interface FastifyPluginOptions {
  /**
   * Rate limiter service URL
   * @default 'http://localhost:3000'
   */
  serviceUrl?: string;

  /**
   * Function to extract the key from the request (e.g., user ID, IP)
   */
  keyExtractor?: (req: FastifyRequest) => string;

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
   * Whether to fail open (allow requests) on errors
   * @default true
   */
  failOpen?: boolean;
}

/**
 * Creates a Fastify plugin for rate limiting
 * 
 * @example
 * ```typescript
 * import Fastify from 'fastify';
 * import { createFastifyPlugin } from '@your-scope/rate-limiter-service';
 * 
 * const fastify = Fastify();
 * 
 * fastify.register(createFastifyPlugin, {
 *   limit: 100,
 *   window: 3600,
 *   keyExtractor: (req) => req.user?.id || req.ip,
 * });
 * ```
 */
export const createFastifyPlugin: FastifyPluginCallback<FastifyPluginOptions> = (
  fastify,
  options,
  done
) => {
  const {
    serviceUrl = 'http://localhost:3000',
    keyExtractor = (req) => req.ip || 'anonymous',
    algorithm = 'token_bucket',
    limit,
    window,
    ruleId,
    failOpen = true,
  } = options;

  const client = new RateLimiterClient(serviceUrl);

  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const key = keyExtractor(request);
      const endpoint = request.url;

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
      reply.header('X-RateLimit-Limit', result.limit);
      reply.header('X-RateLimit-Remaining', result.remaining);
      reply.header('X-RateLimit-Reset', result.resetAt);

      if (!result.allowed) {
        reply.header('Retry-After', result.retryAfter || 0);
        return reply.status(429).send({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded',
          retryAfter: result.retryAfter,
          limit: result.limit,
          resetAt: result.resetAt,
        });
      }
    } catch (error) {
      if (!failOpen) {
        throw error;
      }
      // Fail open: allow the request to proceed
      fastify.log.error({ err: error }, 'Rate limiter error (failing open)');
    }
  });

  done();
};
