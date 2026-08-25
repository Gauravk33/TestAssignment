import { Router } from 'express';
import { z } from 'zod';
import { BoardController } from '../controllers/board.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const createListSchema = z.object({
  body: z.object({
    pageId: z.string().min(1, 'pageId is required'),
    title: z.string().min(1, 'Title is required').max(60),
    position: z.number().int().optional(),
  }),
});

const updateListSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(60).optional(),
    position: z.number().int().optional(),
  }),
});

router.use(requireAuth);

router.post('/', validate(createListSchema), BoardController.createList);
router.get('/', BoardController.getLists);
router.patch('/:id', validate(updateListSchema), BoardController.updateList);
router.delete('/:id', BoardController.deleteList);

export const listRoutes = router;
