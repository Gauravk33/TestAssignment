import mongoose from 'mongoose';
import { env } from './env.js';

let isMemoryDb = false;

export async function connectDB(): Promise<typeof mongoose> {
  try {
    // Attempt standard connection to configured MONGO_URI
    console.log(`[DB] Attempting connection to MongoDB at: ${env.MONGO_URI.replace(/\/\/.*@/, '//<credentials>@')}`);
    
    // Set connection timeout to 15 seconds for Atlas connections
    const conn = await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
    });
    
    console.log(`[DB] Successfully connected to MongoDB (${conn.connection.host}/${conn.connection.name})`);
    return conn;
  } catch (err: any) {
    if (env.USE_MEMORY_DB_FALLBACK) {
      console.warn(`[DB] Could not connect to external MongoDB: ${err.message}. Starting in-memory MongoDB fallback...`);
      try {
        process.env.MONGOMS_DOWNLOAD_DIR = 'E:\\mongodb-binaries';
        const { MongoMemoryReplSet } = await import('mongodb-memory-server');
        const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
        const uri = replSet.getUri('teamspace');
        const conn = await mongoose.connect(uri);
        isMemoryDb = true;
        console.log(`[DB] Successfully started & connected to in-memory MongoDB ReplicaSet at: ${uri}`);
        return conn;
      } catch (fallbackErr: any) {
        console.error(`[DB] Failed to start in-memory fallback: ${fallbackErr.message}`);
        throw fallbackErr;
      }
    } else {
      console.error(`[DB] MongoDB connection error: ${err.message}`);
      throw err;
    }
  }
}

export function getDbStatus(): { status: string; isConnected: boolean; isMemoryDb: boolean } {
  const state = mongoose.connection.readyState;
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return {
    status: states[state] || 'unknown',
    isConnected: state === 1,
    isMemoryDb,
  };
}
