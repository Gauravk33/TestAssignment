import http from 'http';
import { app } from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { initRedis } from './config/redis.js';
import { initSocket } from './socket.js';
import { initDigestWorker } from './jobs/digest.worker.js';

async function bootstrap() {
  try {
    console.log('--- Booting TeamSpace API (Day 1) ---');

    // 1. Connect Database
    await connectDB();

    // 2. Initialize Redis
    await initRedis();

    // 3. Create HTTP Server
    const httpServer = http.createServer(app);

    // 4. Attach Socket.io Real-time Layer
    initSocket(httpServer);
    console.log('[Socket] Socket.io realtime layer attached with JWT handshake');

    // 5. Initialize BullMQ Digest Worker
    initDigestWorker();
    console.log('[BullMQ] Weekly Digest worker initialized');

    // 6. Start Listening
    httpServer.listen(env.PORT, () => {
      console.log(`🚀 TeamSpace API running on http://localhost:${env.PORT}`);
      console.log(`📖 Swagger API Docs: http://localhost:${env.PORT}/api-docs`);
      console.log(`📡 Health check: http://localhost:${env.PORT}/health`);
      console.log(`🔐 Auth routes: http://localhost:${env.PORT}/api/auth`);
      console.log(`🏢 Workspace routes: http://localhost:${env.PORT}/api/workspaces`);
      console.log(`📄 Page routes: http://localhost:${env.PORT}/api/pages`);
    });

    // Graceful Shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
      httpServer.close(() => {
        console.log('[Server] HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('Fatal startup error:', error);
    process.exit(1);
  }
}

bootstrap();
