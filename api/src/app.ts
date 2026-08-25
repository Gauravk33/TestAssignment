import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from './config/env.js';
import { healthRoutes } from './routes/health.routes.js';
import { authRoutes } from './routes/auth.routes.js';
import { requireAuth } from './middleware/requireAuth.js';
import { requireRole } from './middleware/requireRole.js';
import { errorHandler } from './middleware/errorHandler.js';

export const app = express();

// Security & Parsing Middlewares
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman) or matching client
      if (!origin || origin === env.CLIENT_URL || origin.startsWith('http://localhost')) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in dev, can restrict in production
      }
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Root and Health Endpoints
app.use('/', healthRoutes);
app.use('/api', healthRoutes);

// Authentication Routes
app.use('/api/auth', authRoutes);

// Day 0 RBAC Demo / Verification Endpoint
app.get(
  '/api/workspaces/:workspaceId/test-role',
  requireAuth,
  requireRole(['owner', 'admin']),
  (req, res) => {
    res.json({
      success: true,
      message: 'Access granted to privileged workspace resource',
      user: req.user,
      membership: req.membership,
    });
  }
);

// Fallback 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use(errorHandler);
