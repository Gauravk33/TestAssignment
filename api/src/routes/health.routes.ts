import { Router } from 'express';
import { getDbStatus } from '../config/db.js';
import { getRedisStatus } from '../config/redis.js';

const router = Router();

router.get('/health', (_req, res) => {
  const db = getDbStatus();
  const redis = getRedisStatus();
  const isHealthy = db.isConnected;

  return res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    version: '1.0.0',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    services: {
      database: db,
      cache: redis,
    },
  });
});

export const healthRoutes = router;
