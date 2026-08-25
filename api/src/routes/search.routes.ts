import { Router } from 'express';
import { SearchController } from '../controllers/search.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

router.use(requireAuth);

router.get('/', SearchController.search);

export const searchRoutes = router;
