import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

// Configuration schema
const ConfigSchema = z.object({
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  server: z.object({
    rest: z.object({
      port: z.number().int().positive(),
    }),
    grpc: z.object({
      port: z.number().int().positive(),
    }),
  }),
  redis: z.object({
    host: z.string(),
    port: z.number().int().positive(),
    password: z.string().optional(),
    db: z.number().int().min(0).default(0),
  }),
  webhook: z.object({
    timeout: z.number().int().positive(),
    maxRetries: z.number().int().min(0),
    retryDelay: z.number().int().positive(),
  }),
  logging: z.object({
    level: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']),
  }),
});

export type Config = z.infer<typeof ConfigSchema>;

// Load and validate configuration
const loadConfig = (): Config => {
  const config: Config = {
    nodeEnv: (process.env.NODE_ENV as Config['nodeEnv']) || 'development',
    server: {
      rest: {
        port: parseInt(process.env.REST_PORT || '9000', 10),
      },
      grpc: {
        port: parseInt(process.env.GRPC_PORT || '9001', 10),
      },
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || '0', 10),
    },
    webhook: {
      timeout: parseInt(process.env.WEBHOOK_TIMEOUT || '5000', 10),
      maxRetries: parseInt(process.env.WEBHOOK_MAX_RETRIES || '3', 10),
      retryDelay: parseInt(process.env.WEBHOOK_RETRY_DELAY || '1000', 10),
    },
    logging: {
      level: (process.env.LOG_LEVEL as Config['logging']['level']) || 'info',
    },
  };

  // Validate configuration
  return ConfigSchema.parse(config);
};

export const config = loadConfig();
