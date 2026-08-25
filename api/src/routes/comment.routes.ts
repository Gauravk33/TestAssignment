import { Router } from 'express';
import { z } from 'zod';
import { CommentController } from '../controllers/comment.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const createCommentSchema = z.object({
  body: z.object({
    targetType: z.enum(['page', 'block', 'card']),
    targetId: z.string().min(1, 'targetId is required'),
    workspaceId: z.string().min(1, 'workspaceId is required'),
    content: z.string().min(1, 'content is required').max(2000),
    parentId: z.string().nullable().optional(),
  }),
});

const updateCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'content is required').max(2000),
  }),
});

router.use(requireAuth);

router.post('/', validate(createCommentSchema), CommentController.create);
router.get('/', CommentController.list);
router.patch('/:id', validate(updateCommentSchema), CommentController.update);
router.delete('/:id', CommentController.delete);

export const commentRoutes = router;
