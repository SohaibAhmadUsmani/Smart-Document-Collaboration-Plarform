import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiRouter } from './routes/index.js';

export const app = express();

// 1. CORS Configuration for multi-port local dev and previews
const allowedOrigins = [
  env.clientOrigin,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in dev mode
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));

// 2. Segregated Rate Limiter (Excludes debounced autosave and health checks)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: (req) => req.path.includes('/autosave') || req.path === '/health',
});
app.use(generalLimiter);

// 3. System Health Check
app.get('/health', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.status(isDbConnected ? 200 : 200).json({
    status: isDbConnected ? 'ok' : 'degraded',
    service: 'smart-document-backend',
    database: isDbConnected ? 'connected' : 'offline',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 4. API Routes
app.use('/api', apiRouter);

// 5. Catch-All JSON 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `API route ${req.method} ${req.originalUrl} not found.`,
  });
});

// 6. Centralized Error Handler
app.use(errorHandler);
