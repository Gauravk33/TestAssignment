import { Router, Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { enqueueWeeklyDigest } from '../jobs/digest.queue.js';
import { DigestLog } from '../models/DigestLog.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';

const router = Router();

router.use(requireAuth);

router.post(
  '/weekly-digest',
  requireRole(['owner', 'admin']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const workspaceId = req.body.workspaceId || req.workspaceId;
      if (!workspaceId) {
        return res.status(400).json({ success: false, error: 'workspaceId is required' });
      }

      const job = await enqueueWeeklyDigest(workspaceId);

      return res.status(202).json({
        success: true,
        message: 'Weekly digest job enqueued successfully into BullMQ queue',
        data: {
          jobId: job ? job.id : 'queued',
          workspaceId,
        },
      });
    } catch (error) {
      return next(error);
    }
  }
);

router.get(
  '/weekly-digest/logs',
  requireRole(['owner', 'admin', 'editor', 'viewer']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const workspaceId = (req.query.workspaceId as string) || req.workspaceId;
      if (!workspaceId) {
        return res.status(400).json({ success: false, error: 'workspaceId is required' });
      }

      const logs = await DigestLog.find({ workspaceId: new Types.ObjectId(workspaceId) })
        .sort({ processedAt: -1 })
        .limit(20);

      return res.status(200).json({
        success: true,
        data: logs,
      });
    } catch (error) {
      return next(error);
    }
  }
);

export const jobRoutes = router;
