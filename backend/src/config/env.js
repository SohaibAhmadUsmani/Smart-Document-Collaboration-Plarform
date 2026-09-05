import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from monorepo root (3 levels up from config/), then backend root (2 levels up).
// { quiet: true } suppresses dotenv v17's verbose ◇ injected env branding messages.
// [ROMAN URDU]: dotenv v17 har load pe console log karta hai — quiet flag se clean startup milta hai.
dotenv.config({ path: path.resolve(__dirname, '../../../.env'), quiet: true });
dotenv.config({ path: path.resolve(__dirname, '../../.env'), quiet: true });

const nodeEnv = process.env.NODE_ENV ?? 'development';
const isProd = nodeEnv === 'production';

// Port validation (1-65535)
const rawPort = Number(process.env.PORT ?? 5000);
if (Number.isNaN(rawPort) || rawPort < 1 || rawPort > 65535) {
  throw new Error(`[Env Config Error]: PORT must be an integer between 1 and 65535. Received: "${process.env.PORT}"`);
}

// JWT Secret validation: Disallow default/empty secrets in production
const jwtSecret = process.env.JWT_SECRET || (isProd ? '' : 'dev-secret-key-smart-doc-collaboration-2026');
if (isProd && (!jwtSecret || jwtSecret === 'dev-secret-key-smart-doc-collaboration-2026' || jwtSecret.length < 32)) {
  throw new Error('[Security Critical]: JWT_SECRET must be explicitly set to a high-entropy secret (min 32 chars) in production.');
}

// Database URL validation
const databaseUrl = process.env.DATABASE_URL || (isProd ? '' : 'mongodb://localhost:27017/smart_document_collaboration_platform');
if (isProd && !databaseUrl) {
  throw new Error('[Database Critical]: DATABASE_URL must be specified in production.');
}

// Bcrypt salt rounds validation (4-16, default 10)
const bcryptSaltRounds = Math.max(4, Math.min(16, Number(process.env.BCRYPT_SALT_ROUNDS ?? 10)));

// Client origin & allowed origins
const clientOrigin = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';
const allowedOrigins = Array.from(
  new Set([
    clientOrigin,
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:4173',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
  ])
);

export const env = Object.freeze({
  nodeEnv,
  isProd,
  port: rawPort,
  clientOrigin,
  allowedOrigins,
  databaseUrl,
  jwtSecret: jwtSecret || 'dev-secret-key-smart-doc-collaboration-2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  bcryptSaltRounds,
  maxPoolSize: Math.max(5, Number(process.env.DB_MAX_POOL_SIZE ?? 10)),
  minPoolSize: Math.max(0, Number(process.env.DB_MIN_POOL_SIZE ?? 0)),
  devFakeAuth: process.env.DEV_FAKE_AUTH === 'true',
  devFakeUserId: process.env.DEV_FAKE_USER_ID || '000000000000000000000001',
});

