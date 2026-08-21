import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDatabase() {
  if (!env.databaseUrl) {
    throw new Error('DATABASE_URL is not set');
  }

  await mongoose.connect(env.databaseUrl);
  console.log(`Connected to MongoDB: ${mongoose.connection.host}`);
}
