# Rate Limiter Service

Production-ready API Rate Limiting & Quota Management Service built with Node.js/TypeScript, Fastify, and Redis.

## 🚀 Features

- **Multiple Rate Limiting Algorithms**

  - Token Bucket (smooth rate limiting with burst capacity)
  - Fixed Window (simple time-based limiting)
  - Sliding Window (accurate, prevents boundary issues)

- **Dual Interface Support**

  - REST API (Fastify)
  - gRPC (coming soon)

- **Distributed & Scalable**

  - Redis-backed distributed state
  - Works across multiple service instances
  - Atomic operations via Lua scripts

- **Granular Control**

  - Per-user rate limiting
  - Per-API-endpoint limiting
  - Per-IP limiting
  - Composite keys (user+endpoint, IP+endpoint)

- **Smart Notifications**

  - Webhook alerts at configurable thresholds
  - Retry logic with exponential backoff
  - HMAC signatures for security

- **Production Ready**
  - Docker deployment
  - TypeScript client SDK
  - OpenAPI/Swagger documentation
  - Health checks and monitoring

## 📦 Quick Start

### Using Docker Compose (Recommended)

```bash
# Clone the repository
git clone <repo-url>
cd rate-limiter-service

# Start the service
docker-compose -f docker/docker-compose.yml up -d

# Check health
curl http://localhost:3000/v1/health
```

### Local Development

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start Redis (required)
docker run -d -p 6379:6379 redis:7-alpine

# Run in development mode
npm run dev

# Or build and run
npm run build
npm start
```

## 📖 API Documentation

Once the service is running, visit:

- **Swagger UI**: http://localhost:3000/docs
- **API Base**: http://localhost:3000

## 🔧 Usage Examples

### Basic Rate Limiting

```typescript
import { RateLimiterClient } from "./client/rest-client";

const client = new RateLimiterClient("http://localhost:3000");

// Check rate limit
const result = await client.check({
  key: "user:123",
  endpoint: "/api/users",
  algorithm: "token_bucket",
  limit: 100,
  window: 3600, // 1 hour in seconds
});

if (result.allowed) {
  console.log("Request allowed!");
  console.log(`Remaining: ${result.remaining}/${result.limit}`);
} else {
  console.log(`Rate limited! Retry after ${result.retryAfter}s`);
}
```

### Using Rules

```typescript
// Create a reusable rule
const rule = await client.createRule({
  name: "API Users Endpoint",
  algorithm: "token_bucket",
  limit: 1000,
  window: 3600,
  keys: [{ type: "user", value: "*" }],
  webhookUrl: "https://example.com/webhooks/rate-limit",
  thresholds: [80, 90, 100],
});

// Use the rule
const result = await client.check({
  key: "user:456",
  ruleId: rule.id,
});
```

### Express Middleware

```typescript
import express from "express";
import { RateLimiterClient } from "./client/rest-client";

const app = express();
const rateLimiter = new RateLimiterClient("http://localhost:3000");

app.use(async (req, res, next) => {
  try {
    const result = await rateLimiter.check({
      key: `user:${req.user?.id || req.ip}`,
      endpoint: req.path,
      algorithm: "token_bucket",
      limit: 100,
      window: 3600,
    });

    res.set("X-RateLimit-Limit", result.limit);
    res.set("X-RateLimit-Remaining", result.remaining);
    res.set("X-RateLimit-Reset", result.resetAt);

    if (!result.allowed) {
      return res.status(429).json({
        error: "Too many requests",
        retryAfter: result.retryAfter,
      });
    }

    next();
  } catch (error) {
    next(); // Fail open on errors
  }
});
```

## 🎯 Algorithm Comparison

| Algorithm          | Pros                                          | Cons                                 | Best For                              |
| ------------------ | --------------------------------------------- | ------------------------------------ | ------------------------------------- |
| **Token Bucket**   | Smooth rate limiting, allows bursts, flexible | More complex, slightly higher memory | APIs with variable load, file uploads |
| **Fixed Window**   | Simple, fast, low memory                      | Boundary issues, can be gamed        | High throughput, simple limits        |
| **Sliding Window** | Most accurate, no boundary issues             | Higher memory, more complex          | Critical operations, fraud prevention |

## 🔄 Switching Algorithms

Algorithms can be switched at multiple levels:

### 1. Per-Rule Configuration

```typescript
await client.createRule({
  algorithm: "token_bucket", // or 'fixed_window', 'sliding_window'
  // ...
});
```

### 2. Runtime Selection

```typescript
await client.check({
  key: "user:123",
  algorithm: "sliding_window", // Override per request
  limit: 100,
  window: 3600,
});
```

### 3. Dynamic Based on User Tier

```typescript
const algorithm = tier === "free" ? "fixed_window" : "token_bucket";
await client.check({ key, algorithm, limit, window });
```

## 🔔 Webhook Notifications

Configure webhooks to receive notifications when rate limits are approached:

```typescript
await client.createRule({
  name: "Payment API",
  algorithm: "sliding_window",
  limit: 100,
  window: 3600,
  webhookUrl: "https://your-app.com/webhooks/rate-limit",
  thresholds: [80, 90, 100], // Notify at 80%, 90%, 100%
});
```

Webhook payload:

```json
{
  "key": "user:123",
  "endpoint": "/api/payment",
  "limit": 100,
  "currentUsage": 85,
  "threshold": 80,
  "timestamp": "2026-01-11T02:30:00Z",
  "message": "Rate limit 80% threshold reached for user:123"
}
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│           Your Application                      │
│  ┌──────────┐      ┌──────────┐                │
│  │ API GW 1 │      │ API GW 2 │                │
│  └────┬─────┘      └────┬─────┘                │
│       │                 │                       │
│       └────────┬────────┘                       │
│                │                                │
│                ▼                                │
│    ┌───────────────────────┐                   │
│    │  Rate Limiter Service │◄──── REST/gRPC    │
│    │   (This Service)      │                   │
│    └───────────┬───────────┘                   │
│                │                                │
│                ▼                                │
│         ┌──────────┐                            │
│         │  Redis   │  (Distributed State)      │
│         └──────────┘                            │
└─────────────────────────────────────────────────┘
```

## 🛠️ Configuration

Environment variables (`.env`):

```bash
# Server
NODE_ENV=development
REST_PORT=3000
GRPC_PORT=50051

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Webhooks
WEBHOOK_TIMEOUT=5000
WEBHOOK_MAX_RETRIES=3
WEBHOOK_RETRY_DELAY=1000

# Logging
LOG_LEVEL=info
```

## 📊 Monitoring

### Health Check

```bash
curl http://localhost:3000/v1/health
```

### Service Info

```bash
curl http://localhost:3000/v1/info
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run integration tests
npm run test:integration

# Watch mode
npm run test:watch
```

## 📝 API Endpoints

### Rate Limiting

- `POST /v1/check` - Check if request is allowed

### Rule Management

- `POST /v1/rules` - Create rule
- `GET /v1/rules` - List all rules
- `GET /v1/rules/:id` - Get rule by ID
- `PUT /v1/rules/:id` - Update rule
- `DELETE /v1/rules/:id` - Delete rule

### Health

- `GET /v1/health` - Health check
- `GET /v1/info` - Service information

## 🚢 Deployment

### Docker

```bash
docker build -f docker/Dockerfile -t rate-limiter .
docker run -p 3000:3000 -e REDIS_HOST=redis rate-limiter
```

### Docker Compose

```bash
docker-compose -f docker/docker-compose.yml up -d
```

### Kubernetes (coming soon)

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines.

## 💬 Support

- Documentation: http://localhost:3000/docs
- Issues: GitHub Issues
- Email: support@example.com
