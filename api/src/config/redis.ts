import { Redis } from 'ioredis';
import { env } from './env.js';

let redisClient: Redis;
let isRedisMock = false;

export async function initRedis(): Promise<Redis> {
  try {
    console.log(`[Redis] Connecting to Redis at: ${env.REDIS_URI.replace(/\/\/.*@/, '//<credentials>@')}`);
    const client = new Redis(env.REDIS_URI, {
      maxRetriesPerRequest: null, // BullMQ strictly requires maxRetriesPerRequest: null
      connectTimeout: 5000,
      retryStrategy(times) {
        if (times > 3) return null;
        return 500;
      },
      lazyConnect: true,
    });

    await client.connect();
    console.log('[Redis] Successfully connected to Redis instance');
    redisClient = client;
    return redisClient;
  } catch (err: any) {
    console.warn(`[Redis] External Redis unavailable (${err.message}). Using in-memory Redis mock...`);
    const RedisMock = (await import('ioredis-mock')).default;
    // @ts-ignore
    redisClient = new RedisMock();
    isRedisMock = true;
    console.log('[Redis] In-memory Redis mock initialized');
    return redisClient;
  }
}

export function getRedisClient(): Redis {
  if (!redisClient) {
    const RedisMock = require('ioredis-mock');
    redisClient = new RedisMock();
    isRedisMock = true;
  }
  return redisClient;
}

export function getBullMQConnection(): any {
  if (isRedisMock || !redisClient) {
    return getRedisClient();
  }
  return redisClient;
}

export function getRedisStatus(): { status: string; isConnected: boolean; isMock: boolean } {
  return {
    status: redisClient ? 'ready' : 'disconnected',
    isConnected: !!redisClient,
    isMock: isRedisMock,
  };
}
