import { Request, Response, NextFunction } from 'express';
import { CommentService } from '../services/comment.service.js';

export class CommentController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const comment = await CommentService.create({
        targetType: req.body.targetType,
        targetId: req.body.targetId,
        workspaceId: req.body.workspaceId || req.workspaceId!,
        content: req.body.content,
        parentId: req.body.parentId,
        userId: req.user!.id,
      });

      return res.status(201).json({
        success: true,
        message: 'Comment added successfully',
        data: comment,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const targetId = req.query.targetId as string;
      const targetType = req.query.targetType as any;

      if (!targetId) {
        return res.status(400).json({ success: false, error: 'targetId query param is required' });
      }

      const comments = await CommentService.listByTarget(targetId, targetType);
      return res.status(200).json({
        success: true,
        data: comments,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await CommentService.update(req.params.id, req.body.content, req.user!.id);
      return res.status(200).json({
        success: true,
        message: 'Comment updated successfully',
        data: updated,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await CommentService.delete(req.params.id, req.user!.id);
      return res.status(200).json({
        success: true,
        message: 'Comment deleted successfully',
      });
    } catch (error) {
      return next(error);
    }
  }
}
