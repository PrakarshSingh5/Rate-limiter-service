import express from 'express';
import { createExpressMiddleware } from '@prakarsh/rate-limiter/middleware/express';

const app = express();

// Basic rate limiting - 100 requests per hour
app.use(createExpressMiddleware({
  limit: 100,
  window: 3600,
  keyExtractor: (req) => req.ip,
}));

// Different limits for different routes
app.use('/api/auth', createExpressMiddleware({
  limit: 5,
  window: 300, // 5 requests per 5 minutes for auth
  keyExtractor: (req) => req.ip,
}));

app.use('/api/public', createExpressMiddleware({
  limit: 1000,
  window: 3600, // 1000 requests per hour for public
  keyExtractor: (req) => req.ip,
}));

// Routes
app.get('/api/data', (req, res) => {
  res.json({ message: 'Success!', data: [1, 2, 3] });
});

app.post('/api/auth/login', (req, res) => {
  res.json({ token: 'example-token' });
});

app.get('/api/public/info', (req, res) => {
  res.json({ info: 'Public information' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log('📊 Rate limiting is active!');
});
