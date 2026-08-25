import { Router } from 'express';
import { z } from 'zod';
import { BlockController } from '../controllers/block.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const createBlockSchema = z.object({
  body: z.object({
    pageId: z.string().min(1, 'pageId is required'),
    type: z.enum([
      'text',
      'heading1',
      'heading2',
      'heading3',
      'todo',
      'bullet',
      'code',
      'callout',
      'image',
    ]),
    content: z.record(z.any()),
    position: z.number().int().optional(),
  }),
});

const updateBlockSchema = z.object({
  body: z.object({
    content: z.record(z.any()),
    type: z
      .enum([
        'text',
        'heading1',
        'heading2',
        'heading3',
        'todo',
        'bullet',
        'code',
        'callout',
        'image',
      ])
      .optional(),
  }),
});

const reorderBlockSchema = z.object({
  body: z.object({
    pageId: z.string().min(1, 'pageId is required'),
    items: z.array(
      z.object({
        id: z.string().min(1),
        position: z.number().int().min(0),
      })
    ),
  }),
});

router.use(requireAuth);

router.post('/', validate(createBlockSchema), BlockController.create);
router.get('/', BlockController.list);
router.patch('/reorder', validate(reorderBlockSchema), BlockController.reorder);
router.get('/:id', BlockController.getById);
router.patch('/:id', validate(updateBlockSchema), BlockController.update);
router.delete('/:id', BlockController.delete);

export const blockRoutes = router;
