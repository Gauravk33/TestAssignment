import { Router } from 'express';
import { z } from 'zod';
import { BoardController } from '../controllers/board.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const createCardSchema = z.object({
  body: z.object({
    listId: z.string().min(1, 'listId is required'),
    pageId: z.string().min(1, 'pageId is required'),
    title: z.string().min(1, 'Title is required').max(150),
    description: z.string().optional(),
    position: z.number().int().optional(),
    assigneeIds: z.array(z.string()).optional(),
    dueDate: z.string().optional(),
    labels: z.array(z.string()).optional(),
  }),
});

const updateCardSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(150).optional(),
    description: z.string().optional(),
    position: z.number().int().optional(),
    assigneeIds: z.array(z.string()).optional(),
    dueDate: z.string().nullable().optional(),
    labels: z.array(z.string()).optional(),
  }),
});

const moveCardSchema = z.object({
  body: z.object({
    targetListId: z.string().min(1, 'targetListId is required'),
    targetPosition: z.number().int().min(0, 'targetPosition must be non-negative'),
  }),
});

router.use(requireAuth);

router.post('/', validate(createCardSchema), BoardController.createCard);
router.get('/', BoardController.getCards);
router.get('/:id', BoardController.getCardById);
router.patch('/:id', validate(updateCardSchema), BoardController.updateCard);
router.patch('/:id/move', validate(moveCardSchema), BoardController.moveCard);
router.delete('/:id', BoardController.deleteCard);

export const cardRoutes = router;
