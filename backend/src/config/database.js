import dns from 'node:dns';
import mongoose from 'mongoose';
import { env } from './env.js';

export const MONGOOSE_OPTIONS = {
  maxPoolSize: env.maxPoolSize,
  minPoolSize: env.minPoolSize,
  serverSelectionTimeoutMS: 15000,
  connectTimeoutMS: 15000,
  socketTimeoutMS: 45000,
  heartbeatFrequencyMS: 15000,
  maxIdleTimeMS: 45000,
  retryWrites: true,
  family: 4,
};

export function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

export function isMongoConnectivityError(error) {
  if (!error) return false;
  const name = error.name || '';
  const msg = error.message || '';
  return (
    name === 'MongoServerSelectionError' ||
    name === 'MongoNetworkError' ||
    name === 'MongoNetworkTimeoutError' ||
    name === 'MongoTimeoutError' ||
    name === 'MongoTopologyClosedError' ||
    name === 'MongooseError' ||
    msg.includes('timed out') ||
    msg.includes('ETIMEOUT') ||
    msg.includes('ECONNREFUSED') ||
    msg.includes('buffering timed out') ||
    msg.includes('TopologyDescription') ||
    msg.includes('ReplicaSetNoPrimary')
  );
}

// Lifecycle listeners for connection health
mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB Warning]: Mongoose connection lost. Auto-reconnecting in background...');
});

mongoose.connection.on('reconnected', () => {
  console.log('[MongoDB Info]: Mongoose connection re-established.');
});

mongoose.connection.on('error', (err) => {
  console.warn('[MongoDB Warning]: Transient connection issue:', err.message);
});

const DIRECT_ATLAS_FALLBACK =
  'mongodb://vendorhub:vendorhub123@ac-frifocq-shard-00-00.lxzbk8y.mongodb.net:27017,ac-frifocq-shard-00-01.lxzbk8y.mongodb.net:27017,ac-frifocq-shard-00-02.lxzbk8y.mongodb.net:27017/vendorhub-ai?ssl=true&authSource=admin&replicaSet=atlas-13vsxn-shard-0&retryWrites=true&w=majority';

export async function connectDatabase() {
  if (!env.databaseUrl) {
    throw new Error('DATABASE_URL is not configured in .env');
  }

  try {
    await mongoose.connect(env.databaseUrl, MONGOOSE_OPTIONS);
    console.log(`[MongoDB Connected]: Host: ${mongoose.connection.host} (DB: ${mongoose.connection.name})`);
  } catch (error) {
    // If SRV DNS lookup failed on Windows / restricted ISP, try direct replica set URI
    if (
      env.databaseUrl.includes('cluster0.lxzbk8y.mongodb.net') &&
      (error.message?.includes('queryTxt') ||
        error.message?.includes('querySrv') ||
        error.message?.includes('ETIMEOUT') ||
        error.message?.includes('ECONNREFUSED'))
    ) {
      console.warn('[MongoDB Notice]: SRV lookup failed. Attempting direct replica set connection...');
      try {
        await mongoose.connect(DIRECT_ATLAS_FALLBACK, MONGOOSE_OPTIONS);
        console.log(
          `[MongoDB Connected]: Host: ${mongoose.connection.host} (DB: ${mongoose.connection.name}) via direct replica set`
        );
        return;
      } catch (fallbackErr) {
        console.error('[MongoDB Fallback Error]:', fallbackErr.message);
      }
    }
    console.error('[MongoDB Connection Error]:', error.message);
    throw error;
  }
}