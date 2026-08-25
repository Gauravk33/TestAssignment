import { Router } from 'express';
import { z } from 'zod';
import { PageController } from '../controllers/page.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const createPageSchema = z.object({
  body: z.object({
    workspaceId: z.string().min(1, 'workspaceId is required'),
    title: z.string().min(1, 'Title is required').max(100),
    icon: z.string().optional(),
    type: z.enum(['doc', 'board', 'channel']),
    parentId: z.string().nullable().optional(),
  }),
});

const updatePageSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(100).optional(),
    icon: z.string().optional(),
    isArchived: z.boolean().optional(),
  }),
});

const movePageSchema = z.object({
  body: z.object({
    parentId: z.string().nullable().optional(),
    position: z.number().int().min(0),
  }),
});

router.use(requireAuth);

router.get('/tree', PageController.getTree);
router.post('/', validate(createPageSchema), requireRole(['owner', 'admin', 'editor']), PageController.create);
router.get('/:id', PageController.getById);
router.patch('/:id', validate(updatePageSchema), PageController.update);
router.patch('/:id/move', validate(movePageSchema), PageController.move);
router.delete('/:id', PageController.delete);

export const pageRoutes = router;
