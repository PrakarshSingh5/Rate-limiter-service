# @prakarsh/rate-limiter

> Production-ready API Rate Limiting & Quota Management - Use as a library or standalone service

[![npm version](https://badge.fury.io/js/%40prakarsh%2Frate-limiter.svg)](https://www.npmjs.com/package/@prakarsh/rate-limiter)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🎯 Why This Package?

**Stop cloning and deploying!** Simply install this npm package and integrate rate limiting into your application in minutes.

### ✨ Features

- **🚀 Zero Setup** - Install and use immediately
- **🎨 Multiple Algorithms** - Token Bucket, Fixed Window, Sliding Window
- **🔌 Framework Integrations** - Express & Fastify middleware included
- **📊 Distributed** - Redis-backed for multi-instance deployments
- **⚡ High Performance** - Atomic operations via Lua scripts
- **🎯 Flexible** - Use as library or standalone service
- **📝 TypeScript** - Full type definitions included

## 📦 Installation

```bash
npm install @prakarsh/rate-limiter
```

**Requirements:**

- Node.js >= 18
- Redis server (for distributed rate limiting)

## 🚀 Quick Start

### Option 1: Use as Express Middleware (Recommended)

```typescript
import express from "express";
import { createExpressMiddleware } from "@prakarsh/rate-limiter/middleware/express";

const app = express();

// Apply rate limiting to all routes
app.use(
  createExpressMiddleware({
    limit: 100, // 100 requests
    window: 3600, // per hour
    keyExtractor: (req) => req.user?.id || req.ip,
  }),
);

app.get("/api/data", (req, res) => {
  res.json({ message: "Success!" });
});

app.listen(3000);
```

### Option 2: Use as Fastify Plugin

```typescript
import Fastify from "fastify";
import { createFastifyPlugin } from "@prakarsh/rate-limiter/middleware/fastify";

const fastify = Fastify();

fastify.register(createFastifyPlugin, {
  limit: 100,
  window: 3600,
  keyExtractor: (req) => req.user?.id || req.ip,
});

fastify.get("/api/data", async (request, reply) => {
  return { message: "Success!" };
});

fastify.listen({ port: 3000 });
```

### Option 3: Use the Client Directly

```typescript
import { RateLimiterClient } from "@prakarsh/rate-limiter";

const client = new RateLimiterClient("http://localhost:3000");

// Check rate limit
const result = await client.check({
  key: "user:123",
  endpoint: "/api/users",
  algorithm: "token_bucket",
  limit: 100,
  window: 3600,
});

if (result.allowed) {
  console.log(`✅ Request allowed! ${result.remaining} remaining`);
} else {
  console.log(`❌ Rate limited! Retry after ${result.retryAfter}s`);
}
```

### Option 4: Run as Standalone Service

```bash
# Install globally
npm install -g @prakarsh/rate-limiter

# Set environment variables
export REDIS_HOST=localhost
export REDIS_PORT=6379

# Run the service
rate-limiter
```

Then use the REST API from any application:

```bash
curl -X POST http://localhost:3000/v1/check \
  -H "Content-Type: application/json" \
  -d '{
    "key": "user:123",
    "endpoint": "/api/users",
    "algorithm": "token_bucket",
    "limit": 100,
    "window": 3600
  }'
```

## 📚 Usage Examples

### Express with Custom Error Handling

```typescript
import { createExpressMiddleware } from "@prakarsh/rate-limiter/middleware/express";

app.use(
  createExpressMiddleware({
    limit: 100,
    window: 3600,
    keyExtractor: (req) => req.user?.id || req.ip,
    onRateLimitExceeded: (req, res, retryAfter) => {
      res.status(429).json({
        error: "Slow down!",
        retryAfter,
        message: "You have exceeded your rate limit.",
      });
    },
  }),
);
```

### Different Limits for Different Routes

```typescript
// Strict limit for auth endpoints
app.use(
  "/api/auth",
  createExpressMiddleware({
    limit: 5,
    window: 300, // 5 requests per 5 minutes
    keyExtractor: (req) => req.ip,
  }),
);

// Generous limit for public endpoints
app.use(
  "/api/public",
  createExpressMiddleware({
    limit: 1000,
    window: 3600, // 1000 requests per hour
    keyExtractor: (req) => req.ip,
  }),
);
```

### Using Rules for Reusable Configuration

```typescript
import { RateLimiterClient } from "@prakarsh/rate-limiter";

const client = new RateLimiterClient("http://localhost:3000");

// Create a reusable rule
const rule = await client.createRule({
  name: "Premium Users",
  algorithm: "token_bucket",
  limit: 10000,
  window: 3600,
  keys: [{ type: "user", value: "*" }],
  webhookUrl: "https://your-app.com/webhooks/rate-limit",
  thresholds: [80, 90, 100],
});

// Use the rule
const result = await client.check({
  key: "user:premium-123",
  ruleId: rule.id,
});
```

### Algorithm Comparison

```typescript
// Token Bucket - Best for APIs with variable load
await client.check({
  key: "user:123",
  algorithm: "token_bucket", // Allows bursts
  limit: 100,
  window: 3600,
});

// Fixed Window - Simplest and fastest
await client.check({
  key: "user:123",
  algorithm: "fixed_window", // Simple time windows
  limit: 100,
  window: 3600,
});

// Sliding Window - Most accurate
await client.check({
  key: "user:123",
  algorithm: "sliding_window", // No boundary issues
  limit: 100,
  window: 3600,
});
```

## 🎨 Algorithms

| Algorithm          | Best For                | Pros                    | Cons                  |
| ------------------ | ----------------------- | ----------------------- | --------------------- |
| **Token Bucket**   | APIs with variable load | Allows bursts, flexible | Slightly more complex |
| **Fixed Window**   | High throughput         | Simple, fast            | Boundary issues       |
| **Sliding Window** | Critical operations     | Most accurate           | Higher memory         |

## 🔧 Configuration

### Environment Variables

```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Server Configuration (for standalone mode)
REST_PORT=3000
NODE_ENV=production

# Webhook Configuration
WEBHOOK_TIMEOUT=5000
WEBHOOK_MAX_RETRIES=3
```

### Middleware Options

```typescript
interface ExpressMiddlewareOptions {
  serviceUrl?: string; // Rate limiter service URL
  keyExtractor?: (req) => string; // Extract key from request
  algorithm?: "token_bucket" | "fixed_window" | "sliding_window";
  limit: number; // Max requests
  window: number; // Time window in seconds
  ruleId?: string; // Use predefined rule
  failOpen?: boolean; // Allow on errors (default: true)
  onRateLimitExceeded?: (req, res, retryAfter) => void;
}
```

## 📊 Response Headers

All rate-limited responses include these headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 2026-01-30T15:30:00Z
Retry-After: 3600  (only when rate limited)
```

## 🔔 Webhook Notifications

Get notified when users approach their limits:

```typescript
await client.createRule({
  name: "API Endpoint",
  algorithm: "token_bucket",
  limit: 1000,
  window: 3600,
  webhookUrl: "https://your-app.com/webhooks/rate-limit",
  thresholds: [80, 90, 100], // Notify at 80%, 90%, 100%
});
```

Webhook payload:

```json
{
  "key": "user:123",
  "endpoint": "/api/data",
  "limit": 1000,
  "currentUsage": 850,
  "threshold": 80,
  "timestamp": "2026-01-30T15:30:00Z",
  "message": "Rate limit 80% threshold reached"
}
```

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│      Your Application               │
│  ┌──────────────────────────┐       │
│  │  Express/Fastify App     │       │
│  │  with Rate Limiter       │       │
│  │  Middleware              │       │
│  └──────────┬───────────────┘       │
│             │                        │
│             ▼                        │
│      ┌──────────────┐                │
│      │    Redis     │                │
│      │ (Distributed │                │
│      │    State)    │                │
│      └──────────────┘                │
└─────────────────────────────────────┘
```

## 🚀 Deployment

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --production

COPY . .

ENV REDIS_HOST=redis
ENV REST_PORT=3000

CMD ["rate-limiter"]
```

### Docker Compose

```yaml
version: "3.8"
services:
  rate-limiter:
    image: your-app:latest
    ports:
      - "3000:3000"
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

## 📖 API Reference

### Client Methods

#### `check(request: CheckRequest): Promise<CheckResult>`

Check if a request is allowed.

#### `createRule(rule: CreateRuleRequest): Promise<Rule>`

Create a reusable rate limit rule.

#### `getRule(id: string): Promise<Rule>`

Get a rule by ID.

#### `getAllRules(): Promise<Rule[]>`

Get all rules.

#### `updateRule(id: string, update: Partial<CreateRuleRequest>): Promise<Rule>`

Update a rule.

#### `deleteRule(id: string): Promise<void>`

Delete a rule.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT © Prakarsh Singh

## 🔗 Links

- [GitHub Repository](https://github.com/PrakarshSingh5/rate-limiter-service)
- [npm Package](https://www.npmjs.com/package/@prakarsh/rate-limiter)
- [Issues](https://github.com/PrakarshSingh5/rate-limiter-service/issues)

## 💡 Why Choose This Over Cloning?

| Cloning & Deploying  | Using NPM Package   |
| -------------------- | ------------------- |
| ❌ Clone repository  | ✅ `npm install`    |
| ❌ Setup environment | ✅ Import and use   |
| ❌ Deploy separately | ✅ Runs in your app |
| ❌ Maintain updates  | ✅ `npm update`     |
| ❌ Complex setup     | ✅ 3 lines of code  |

**Start rate limiting in 30 seconds instead of 30 minutes!**
