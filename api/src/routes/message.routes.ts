import { Router } from 'express';
import { z } from 'zod';
import { MessageController } from '../controllers/message.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';

const router = Router({ mergeParams: true });

const createMessageSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Message content is required').max(4000),
    attachments: z.array(z.string()).optional(),
    parentMessageId: z.string().nullable().optional(),
  }),
});

router.use(requireAuth);

router.post('/:id/messages', validate(createMessageSchema), MessageController.create);
router.get('/:id/messages', MessageController.list);
router.delete('/messages/:id', MessageController.delete);

export const messageRoutes = router;
