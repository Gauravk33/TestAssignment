import { getRedisClient } from '../config/redis.js';

export class CacheService {
  private static DEFAULT_TTL = 300; // 5 minutes

  static async get<T>(key: string): Promise<T | null> {
    try {
      const client = getRedisClient();
      const data = await client.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (err) {
      console.warn(`[Cache] Get error for key ${key}:`, err);
      return null;
    }
  }

  static async set(key: string, value: any, ttlSeconds: number = this.DEFAULT_TTL): Promise<void> {
    try {
      const client = getRedisClient();
      await client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (err) {
      console.warn(`[Cache] Set error for key ${key}:`, err);
    }
  }

  static async del(key: string): Promise<void> {
    try {
      const client = getRedisClient();
      await client.del(key);
    } catch (err) {
      console.warn(`[Cache] Del error for key ${key}:`, err);
    }
  }

  static async delByPattern(pattern: string): Promise<void> {
    try {
      const client = getRedisClient();
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(...keys);
      }
    } catch (err) {
      console.warn(`[Cache] DelByPattern error for pattern ${pattern}:`, err);
    }
  }

  // Domain helpers
  static getPageTreeKey(workspaceId: string): string {
    return `ws:${workspaceId}:page_tree`;
  }

  static getPageKey(pageId: string): string {
    return `page:${pageId}`;
  }

  static async invalidateWorkspacePages(workspaceId: string): Promise<void> {
    await this.del(this.getPageTreeKey(workspaceId));
    await this.delByPattern(`page:*`);
  }
}
