import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { swaggerSpec } from './docs/swagger.js';

// Route Imports
import { healthRoutes } from './routes/health.routes.js';
import { authRoutes } from './routes/auth.routes.js';
import { workspaceRoutes } from './routes/workspace.routes.js';
import { pageRoutes } from './routes/page.routes.js';
import { blockRoutes } from './routes/block.routes.js';
import { listRoutes } from './routes/list.routes.js';
import { cardRoutes } from './routes/card.routes.js';
import { messageRoutes } from './routes/message.routes.js';
import { commentRoutes } from './routes/comment.routes.js';
import { auditRoutes } from './routes/audit.routes.js';
import { searchRoutes } from './routes/search.routes.js';
import { statsRoutes } from './routes/stats.routes.js';
import { attachmentRoutes } from './routes/attachment.routes.js';
import { jobRoutes } from './routes/job.routes.js';

import { requireAuth } from './middleware/requireAuth.js';
import { requireRole } from './middleware/requireRole.js';
import { errorHandler } from './middleware/errorHandler.js';

export const app = express();
export const createApp = () => app;
export default app;

// Security & Parsing Middlewares
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || origin === env.CLIENT_URL || origin.startsWith('http://localhost')) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads serving
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Swagger OpenAPI Documentation UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Root and Health Endpoints
app.use('/', healthRoutes);
app.use('/api', healthRoutes);

// Core REST Routes (Day 0 & Day 1)
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/workspaces', statsRoutes);
app.use('/api/pages', pageRoutes);
app.use('/api/pages', messageRoutes);
app.use('/api/blocks', blockRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/jobs', jobRoutes);

// Privilege RBAC Verification Endpoint
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
