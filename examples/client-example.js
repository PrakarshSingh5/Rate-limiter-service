import { RateLimiterClient } from '@prakarsh/rate-limiter';

const client = new RateLimiterClient('http://localhost:3000');

async function main() {
  console.log('🚀 Rate Limiter Client Example\n');

  // Example 1: Basic rate limit check
  console.log('Example 1: Basic Check');
  const result1 = await client.check({
    key: 'user:123',
    endpoint: '/api/users',
    algorithm: 'token_bucket',
    limit: 100,
    window: 3600,
  });

  console.log('Result:', result1);
  console.log(`Allowed: ${result1.allowed}`);
  console.log(`Remaining: ${result1.remaining}/${result1.limit}\n`);

  // Example 2: Create and use a rule
  console.log('Example 2: Using Rules');
  const rule = await client.createRule({
    name: 'Premium API Access',
    algorithm: 'sliding_window',
    limit: 10000,
    window: 3600,
    keys: [{ type: 'user', value: '*' }],
    thresholds: [80, 90, 100],
  });

  console.log('Created rule:', rule.id);

  const result2 = await client.check({
    key: 'user:premium-456',
    ruleId: rule.id,
  });

  console.log('Result:', result2);
  console.log(`Remaining: ${result2.remaining}/${result2.limit}\n`);

  // Example 3: List all rules
  console.log('Example 3: List All Rules');
  const rules = await client.getAllRules();
  console.log(`Total rules: ${rules.length}`);
  rules.forEach(r => {
    console.log(`- ${r.name} (${r.algorithm}): ${r.limit}/${r.window}s`);
  });

  // Example 4: Health check
  console.log('\nExample 4: Health Check');
  const health = await client.health();
  console.log('Health:', health);
}

main().catch(console.error);
