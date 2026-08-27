import dns from 'node:dns';
import mongoose from 'mongoose';
import { env } from './env.js';

// Resilient DNS resolution for MongoDB Atlas SRV connection strings on Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4', '1.0.0.1']);
} catch (dnsErr) {
  console.warn('[Database Notice]: Custom DNS servers could not be set:', dnsErr.message);
}

const MONGOOSE_OPTIONS = {
  maxPoolSize: 20,
  minPoolSize: 5,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  family: 4,
};

export async function connectDatabase() {
  if (!env.databaseUrl) {
    throw new Error('DATABASE_URL is not configured in .env');
  }

  try {
    await mongoose.connect(env.databaseUrl, MONGOOSE_OPTIONS);
    console.log(`[MongoDB Connected]: Host: ${mongoose.connection.host} (DB: ${mongoose.connection.name})`);
  } catch (error) {
    console.error('[MongoDB Connection Error]:', error.message);
    process.exit(1);
  }
}