#!/usr/bin/env node

/**
 * CLI for running Rate Limiter Service as a standalone server
 */

import { getStorage } from './storage/redis';
import { RuleService } from './cache/rule-service';
import { RateLimiterService } from './services/rate-limiter';
import { createRestServer } from './api/rest/server';
import { config } from './config';

async function main() {
  console.log('🚀 Starting Rate Limiter Service...');
  console.log(`Environment: ${config.nodeEnv}`);

  // Initialize storage
  const storage = getStorage();
  console.log('✅ Redis storage initialized');

  // Initialize services
  const ruleService = new RuleService(storage);
  const rateLimiter = new RateLimiterService(storage, ruleService);
  console.log('✅ Services initialized');

  // Create REST server
  const restServer = createRestServer(storage, ruleService, rateLimiter);

  try {
    // Start REST server
    await restServer.listen({
      port: config.server.rest.port,
      host: '0.0.0.0',
    });
    
    console.log(`✅ REST API listening on http://localhost:${config.server.rest.port}`);
    console.log(`📚 API Documentation: http://localhost:${config.server.rest.port}/docs`);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\n🛑 Shutting down gracefully...');
    
    try {
      await restServer.close();
      await storage.close();
      console.log('✅ Shutdown complete');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
