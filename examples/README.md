# Examples

This directory contains example implementations showing how to use `@prakarsh/rate-limiter` in different scenarios.

## Prerequisites

Before running these examples, you need:

1. **Redis running** (required for rate limiting):

   ```bash
   docker run -d -p 6379:6379 redis:7-alpine
   ```

2. **Rate limiter service running** (for client example):
   ```bash
   # In the main project directory
   npm start
   # OR
   rate-limiter
   ```

## Examples

### 1. Express Middleware (`express-example.js`)

Shows how to integrate rate limiting into an Express application.

**Run:**

```bash
node express-example.js
```

**Test:**

```bash
# Make requests
curl http://localhost:3001/api/data

# Check rate limit headers
curl -i http://localhost:3001/api/data

# Test auth endpoint (stricter limits)
curl http://localhost:3001/api/auth/login
```

**Features:**

- Global rate limiting
- Route-specific limits
- IP-based rate limiting

### 2. Fastify Plugin (`fastify-example.js`)

Shows how to use rate limiting with Fastify.

**Run:**

```bash
node fastify-example.js
```

**Test:**

```bash
curl http://localhost:3001/api/data
curl -X POST http://localhost:3001/api/users
```

**Features:**

- Fastify plugin integration
- Token bucket algorithm
- Automatic header injection

### 3. Direct Client Usage (`client-example.js`)

Shows how to use the RateLimiterClient directly.

**Prerequisites:**
Make sure the rate limiter service is running first:

```bash
npm start  # In the main project directory
```

**Run:**

```bash
node client-example.js
```

**Features:**

- Direct API calls
- Rule management
- Health checks
- Multiple algorithms

## Installing Dependencies

If you want to run these examples in a separate project:

```bash
npm install @prakarsh/rate-limiter express fastify
```

## Common Issues

### "ECONNREFUSED" Error

**Problem:** Can't connect to Redis or rate limiter service.

**Solution:**

1. Make sure Redis is running: `docker ps`
2. For client example, ensure rate limiter service is running
3. Check the connection URLs in the examples

### "Module not found" Error

**Problem:** Package not installed.

**Solution:**

```bash
npm install @prakarsh/rate-limiter
```

Or for local development:

```bash
cd /path/to/rate-limiter-service
npm link
cd /path/to/examples
npm link @prakarsh/rate-limiter
```

## Next Steps

- Modify the examples to fit your use case
- Try different algorithms (token_bucket, fixed_window, sliding_window)
- Experiment with different limits and windows
- Add webhook notifications
- Create custom error handlers

## Need Help?

- [GitHub Issues](https://github.com/PrakarshSingh5/rate-limiter-service/issues)
- [Full Documentation](../README.md)
