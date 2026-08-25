import { Request, Response, NextFunction } from 'express';
import { MessageService } from '../services/message.service.js';

export class MessageController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const pageId = req.params.id || req.body.pageId;
      const message = await MessageService.create({
        pageId,
        content: req.body.content,
        attachments: req.body.attachments,
        parentMessageId: req.body.parentMessageId,
        userId: req.user!.id,
      });

      return res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        data: message,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const pageId = req.params.id || (req.query.pageId as string);
      const cursor = req.query.cursor as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

      const result = await MessageService.listMessages({
        pageId,
        cursor,
        limit,
      });

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await MessageService.delete(req.params.id, req.user!.id);
      return res.status(200).json({
        success: true,
        message: 'Message deleted successfully',
      });
    } catch (error) {
      return next(error);
    }
  }
}
