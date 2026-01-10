import { RateLimiterClient, RateLimitError } from '../client/rest-client';

/**
 * Example: Basic rate limiting
 */
async function basicExample() {
  const client = new RateLimiterClient('http://localhost:3000');

  try {
    // Check rate limit with inline parameters
    const result = await client.check({
      key: 'user:123',
      endpoint: '/api/users',
      algorithm: 'token_bucket',
      limit: 100,
      window: 3600, // 1 hour
    });

    if (result.allowed) {
      console.log('✅ Request allowed');
      console.log(`Remaining: ${result.remaining}/${result.limit}`);
      console.log(`Resets at: ${result.resetAt}`);
    } else {
      console.log('❌ Rate limit exceeded');
      console.log(`Retry after: ${result.retryAfter} seconds`);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example: Using rules
 */
async function ruleExample() {
  const client = new RateLimiterClient('http://localhost:3000');

  try {
    // Create a rule
    const rule = await client.createRule({
      name: 'API Users Endpoint',
      algorithm: 'token_bucket',
      limit: 1000,
      window: 3600,
      keys: [
        { type: 'user', value: '*' },
      ],
      webhookUrl: 'https://example.com/webhooks/rate-limit',
      thresholds: [80, 90, 100],
    });

    console.log('Created rule:', rule.id);

    // Use the rule
    const result = await client.check({
      key: 'user:456',
      endpoint: '/api/users',
      ruleId: rule.id,
    });

    console.log('Check result:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example: Express middleware
 */
function expressMiddlewareExample() {
  const client = new RateLimiterClient('http://localhost:3000');

  return async (req: any, res: any, next: any) => {
    try {
      const result = await client.check({
        key: `user:${req.user?.id || req.ip}`,
        endpoint: req.path,
        algorithm: 'token_bucket',
        limit: 100,
        window: 3600,
      });

      // Add rate limit headers
      res.set('X-RateLimit-Limit', result.limit);
      res.set('X-RateLimit-Remaining', result.remaining);
      res.set('X-RateLimit-Reset', result.resetAt);

      if (!result.allowed) {
        return res.status(429).json({
          error: 'Too many requests',
          retryAfter: result.retryAfter,
        });
      }

      next();
    } catch (error) {
      console.error('Rate limit check failed:', error);
      next(); // Fail open
    }
  };
}

/**
 * Example: Different algorithms for different tiers
 */
async function tierBasedExample() {
  const client = new RateLimiterClient('http://localhost:3000');

  const userTier = 'pro'; // or 'free', 'enterprise'

  const tierConfigs = {
    free: {
      algorithm: 'fixed_window' as const,
      limit: 100,
      window: 3600,
    },
    pro: {
      algorithm: 'token_bucket' as const,
      limit: 10000,
      window: 3600,
    },
    enterprise: {
      algorithm: 'sliding_window' as const,
      limit: 100000,
      window: 3600,
    },
  };

  const config = tierConfigs[userTier];

  try {
    const result = await client.check({
      key: `user:789:${userTier}`,
      endpoint: '/api/data',
      ...config,
    });

    console.log(`${userTier} tier check:`, result);
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example: Error handling
 */
async function errorHandlingExample() {
  const client = new RateLimiterClient('http://localhost:3000');

  try {
    const result = await client.check({
      key: 'user:999',
      algorithm: 'token_bucket',
      limit: 10,
      window: 60,
    });

    if (!result.allowed) {
      throw new RateLimitError(
        result.retryAfter || 0,
        result.limit,
        result.resetAt
      );
    }

    // Process request
    console.log('Processing request...');
  } catch (error) {
    if (error instanceof RateLimitError) {
      console.log(`Rate limited! Retry after ${error.retryAfter}s`);
      console.log(`Limit: ${error.limit}`);
      console.log(`Resets at: ${error.resetAt}`);
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

// Run examples
async function main() {
  console.log('=== Basic Example ===');
  await basicExample();

  console.log('\n=== Rule Example ===');
  await ruleExample();

  console.log('\n=== Tier-Based Example ===');
  await tierBasedExample();

  console.log('\n=== Error Handling Example ===');
  await errorHandlingExample();
}

main().catch(console.error);
