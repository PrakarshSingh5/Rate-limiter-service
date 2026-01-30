import Fastify from 'fastify';
import { createFastifyPlugin } from '@prakarsh/rate-limiter/middleware/fastify';

const fastify = Fastify({
  logger: true
});

// Register rate limiting plugin
fastify.register(createFastifyPlugin, {
  limit: 100,
  window: 3600,
  algorithm: 'token_bucket',
  keyExtractor: (req) => req.ip,
});

// Routes
fastify.get('/api/data', async (request, reply) => {
  return { message: 'Success!', data: [1, 2, 3] };
});

fastify.post('/api/users', async (request, reply) => {
  return { id: 1, name: 'John Doe' };
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    console.log('✅ Server running on http://localhost:3001');
    console.log('📊 Rate limiting is active!');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
