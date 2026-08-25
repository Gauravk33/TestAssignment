import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { AuditLog } from '../models/AuditLog.js';

export class AuditController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = (req.query.workspaceId as string) || req.workspaceId;
      if (!workspaceId) {
        return res.status(400).json({ success: false, error: 'workspaceId query param is required' });
      }

      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const skip = (page - 1) * limit;

      const [logs, total] = await Promise.all([
        AuditLog.find({ workspaceId: new Types.ObjectId(workspaceId) })
          .populate('actorId', 'name email avatarUrl')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        AuditLog.countDocuments({ workspaceId: new Types.ObjectId(workspaceId) }),
      ]);

      return res.status(200).json({
        success: true,
        data: {
          logs,
          pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      return next(error);
    }
  }
}
