import { Router } from 'express';
import { StatsController } from '../controllers/stats.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';

const router = Router();

router.use(requireAuth);

router.get('/:id/stats', requireRole(['owner', 'admin', 'editor', 'viewer']), StatsController.getWorkspaceStats);

export const statsRoutes = router;
