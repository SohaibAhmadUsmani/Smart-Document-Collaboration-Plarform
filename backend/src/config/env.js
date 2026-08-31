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

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 5000),
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL || 'mongodb://localhost:27017/smart_document_collaboration_platform',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-key-smart-doc-collaboration-2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d'
};

