import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDatabase() {
  if (!env.databaseUrl) {
    console.warn('[Database] DATABASE_URL is not defined in environment. Database connection skipped.');
    return;
  }

  try {
    await mongoose.connect(env.databaseUrl);
    console.log('[Database] Successfully connected to MongoDB.');
  } catch (error) {
    console.error('[Database] Failed to connect to MongoDB:', error.message);
  }
}

