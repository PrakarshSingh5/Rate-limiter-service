import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { config } from '../../config';
import { Storage } from '../../storage/types';
import { RuleService } from '../../cache/rule-service';
import { RateLimiterService } from '../../services/rate-limiter';
import { checkRoutes } from './routes/check';
import { ruleRoutes } from './routes/rules';
import { healthRoutes } from './routes/health';

export const createRestServer = (
  storage: Storage,
  ruleService: RuleService,
  rateLimiter: RateLimiterService
): FastifyInstance => {
  const app = Fastify({
    logger: {
      level: config.logging.level,
      transport: config.nodeEnv === 'development' ? {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      } : undefined,
    },
  });

  // Register CORS
  app.register(cors, {
    origin: true,
    credentials: true,
  });

  // Register Swagger
  app.register(swagger, {
    swagger: {
      info: {
        title: 'Rate Limiter Service API',
        description: 'Production-ready API Rate Limiting & Quota Management Service',
        version: '1.0.0',
      },
      host: `localhost:${config.server.rest.port}`,
      schemes: ['http', 'https'],
      consumes: ['application/json'],
      produces: ['application/json'],
      tags: [
        { name: 'Rate Limiting', description: 'Rate limit check endpoints' },
        { name: 'Rules', description: 'Rule management endpoints' },
        { name: 'Health', description: 'Health check endpoints' },
      ],
    },
  });

  app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
  });

  // Register routes
  checkRoutes(app, rateLimiter);
  ruleRoutes(app, ruleService);
  healthRoutes(app, storage);

  // Root endpoint
  app.get('/', async () => {
    return {
      service: 'Rate Limiter Service',
      version: '1.0.0',
      docs: '/docs',
    };
  });

  // Error handler
  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);
    reply.status(500).send({
      error: 'Internal server error',
      message: config.nodeEnv === 'development' ? error.message : undefined,
    });
  });

  return app;
};
