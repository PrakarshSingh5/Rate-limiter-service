import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Storage } from '../../../storage/types';

export const healthRoutes = (
  app: FastifyInstance,
  storage: Storage
) => {
  /**
   * GET /v1/health
   * Health check endpoint
   */
  app.get(
    '/v1/health',
    {
      schema: {
        description: 'Health check endpoint',
        tags: ['Health'],
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              timestamp: { type: 'string' },
              redis: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Check Redis connection
        await storage.getClient().ping();

        return reply.send({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          redis: 'connected',
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(503).send({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          redis: 'disconnected',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * GET /v1/info
   * Service information
   */
  app.get(
    '/v1/info',
    {
      schema: {
        description: 'Service information',
        tags: ['Health'],
      },
    },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      return reply.send({
        name: 'Rate Limiter Service',
        version: '1.0.0',
        algorithms: ['token_bucket', 'fixed_window', 'sliding_window'],
        features: [
          'Multiple rate limiting algorithms',
          'REST and gRPC interfaces',
          'Distributed state with Redis',
          'Webhook notifications',
          'Granular control (user, IP, endpoint)',
        ],
      });
    }
  );
};
