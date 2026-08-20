import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiRouter } from './routes/index.js';

export const app = express();

app.use(cors({ origin: env.clientOrigin }));
app.use(express.json({ limit: '2mb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 }));

app.get('/health', (request, response) => {
  response.json({ status: 'ok', service: 'smart-document-backend' });
});

app.use('/api', apiRouter);
app.use(errorHandler);
