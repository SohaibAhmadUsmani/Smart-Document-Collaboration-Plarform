import 'dotenv/config';

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 5000),
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL || 'mongodb+srv://vendorhub:vendorhub123@cluster0.lxzbk8y.mongodb.net/smart_document_collaboration_system?appName=Cluster0',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-key-smart-doc-collaboration-2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d'
};