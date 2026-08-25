import dotenv from 'dotenv';
import path from 'path';

process.env.MONGOMS_DOWNLOAD_DIR = 'E:\\mongodb-binaries';

// Load .env from api directory or root directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/teamspace',
  REDIS_URI: process.env.REDIS_URI || 'redis://localhost:6379',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'teamspace_access_secret_change_in_prod_key',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'teamspace_refresh_secret_change_in_prod_key',
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  USE_MEMORY_DB_FALLBACK: process.env.USE_MEMORY_DB_FALLBACK !== 'false',
};
