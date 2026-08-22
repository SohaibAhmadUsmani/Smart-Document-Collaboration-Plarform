import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDatabase() {
  try {
    await mongoose.connect(env.databaseUrl);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
}
