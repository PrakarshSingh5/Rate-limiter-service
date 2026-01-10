import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { CheckRequest, CheckRequestSchema } from '../../../models/result';
import { RateLimiterService } from '../../../services/rate-limiter';

export const checkRoutes = (
  app: FastifyInstance,
  rateLimiter: RateLimiterService
) => {
  /**
   * POST /v1/check
   * Check if a request is allowed under rate limit
   */
  app.post<{ Body: CheckRequest }>(
    '/v1/check',
    {
      schema: {
        description: 'Check rate limit for a request',
        tags: ['Rate Limiting'],
        body: {
          type: 'object',
          required: ['key'],
          properties: {
            key: { type: 'string', description: 'Unique identifier (e.g., user:123, ip:192.168.1.1)' },
            endpoint: { type: 'string', description: 'API endpoint being accessed' },
            ruleId: { type: 'string', format: 'uuid', description: 'Rule ID to use' },
            algorithm: { type: 'string', enum: ['token_bucket', 'fixed_window', 'sliding_window'] },
            limit: { type: 'number', minimum: 1 },
            window: { type: 'number', minimum: 1 },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              allowed: { type: 'boolean' },
              limit: { type: 'number' },
              remaining: { type: 'number' },
              resetAt: { type: 'string', format: 'date-time' },
              retryAfter: { type: 'number' },
              currentUsage: { type: 'number' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: CheckRequest }>, reply: FastifyReply) => {
      try {
        // Validate request
        const validated = CheckRequestSchema.parse(request.body);

        // Check rate limit
        const result = await rateLimiter.check(validated);

        // Set rate limit headers
        reply.header('X-RateLimit-Limit', result.limit);
        reply.header('X-RateLimit-Remaining', result.remaining);
        reply.header('X-RateLimit-Reset', result.resetAt.toISOString());

        if (!result.allowed && result.retryAfter) {
          reply.header('Retry-After', result.retryAfter);
          return reply.status(429).send({
            ...result,
            error: 'Rate limit exceeded',
          });
        }

        return reply.send(result);
      } catch (error) {
        request.log.error(error);
        return reply.status(400).send({
          error: error instanceof Error ? error.message : 'Invalid request',
        });
      }
    }
  );
};
