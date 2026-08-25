import { Router } from 'express';
import { z } from 'zod';
import { WorkspaceController } from '../controllers/workspace.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const createWorkspaceSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Workspace name must be at least 2 characters').max(60),
    icon: z.string().optional(),
  }),
});

const updateWorkspaceSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(60).optional(),
    icon: z.string().optional(),
  }),
});

const inviteMemberSchema = z.object({
  body: z.object({
    email: z.string().email('Please provide a valid email'),
    role: z.enum(['owner', 'admin', 'editor', 'viewer']),
  }),
});

const updateRoleSchema = z.object({
  body: z.object({
    role: z.enum(['owner', 'admin', 'editor', 'viewer']),
  }),
});

router.use(requireAuth);

router.post('/', validate(createWorkspaceSchema), WorkspaceController.create);
router.get('/', WorkspaceController.list);
router.get('/:id', requireRole(['owner', 'admin', 'editor', 'viewer']), WorkspaceController.getById);
router.patch('/:id', requireRole(['owner', 'admin']), validate(updateWorkspaceSchema), WorkspaceController.update);
router.delete('/:id', requireRole('owner'), WorkspaceController.delete);

// Membership Routes
router.post('/:id/invite', requireRole(['owner', 'admin']), validate(inviteMemberSchema), WorkspaceController.invite);
router.patch('/:id/members/:userId', requireRole(['owner', 'admin']), validate(updateRoleSchema), WorkspaceController.updateMemberRole);

export const workspaceRoutes = router;
