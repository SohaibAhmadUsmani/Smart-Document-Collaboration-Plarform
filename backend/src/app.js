import compression from 'compression';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiRouter } from './routes/index.js';

export const app = express();

// 1. Security Headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: false, // Avoid breaking client websocket / vite hot-reload in dev
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// 2. Response Compression
app.use(compression());

// 3. CORS Configuration
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || env.allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        if (env.nodeEnv === 'development') {
          callback(null, true); // Permissive in local dev only
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    },
    credentials: true,
  })
);

// 4. Request Body Parsers (1mb global limit to prevent DoS)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 5. System Health Check (Mounted before rate limiter, returns 503 if DB disconnected)
app.get('/health', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.status(isDbConnected ? 200 : 503).json({
    status: isDbConnected ? 'ok' : 'degraded',
    service: 'smart-document-backend',
    database: isDbConnected ? 'connected' : 'offline',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 6. Rate Limiting (1000 req / 15 min general limit, relaxed in development)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.nodeEnv === 'development' ? 50000 : 1000,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: (req) => env.nodeEnv === 'development' || req.path === '/health',
});
app.use(generalLimiter);

// 7. API Routes
app.use('/api', apiRouter);

// 8. Catch-All JSON 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `API route ${req.method} ${req.originalUrl} not found.`,
  });
});

// 9. Centralized Error Handler
app.use(errorHandler);
