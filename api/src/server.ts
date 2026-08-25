import { app } from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { initRedis } from './config/redis.js';

async function bootstrap() {
  try {
    console.log('--- Booting TeamSpace API ---');
    
    // Connect Database
    await connectDB();

    // Initialize Redis
    await initRedis();

    // Start Express Server
    const server = app.listen(env.PORT, () => {
      console.log(`🚀 TeamSpace API running on http://localhost:${env.PORT}`);
      console.log(`📡 Health check: http://localhost:${env.PORT}/health`);
      console.log(`🔐 Auth routes: http://localhost:${env.PORT}/api/auth`);
    });

    // Graceful Shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
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
