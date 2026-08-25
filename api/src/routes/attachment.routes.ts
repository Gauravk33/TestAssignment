import { Router } from 'express';
import { AttachmentController, upload } from '../controllers/attachment.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

router.use(requireAuth);

router.post('/', upload.single('file'), AttachmentController.uploadFile);
router.get('/:id', AttachmentController.getById);
router.delete('/:id', AttachmentController.delete);

export const attachmentRoutes = router;
