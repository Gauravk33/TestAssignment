import { Router } from 'express';
import { AuditController } from '../controllers/audit.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';

const router = Router();

router.use(requireAuth);

router.get('/', requireRole(['owner', 'admin', 'editor', 'viewer']), AuditController.list);

export const auditRoutes = router;
