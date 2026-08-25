import { Request, Response, NextFunction } from 'express';
import { BlockService } from '../services/block.service.js';

export class BlockController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const block = await BlockService.create({
        pageId: req.body.pageId,
        type: req.body.type,
        content: req.body.content,
        position: req.body.position,
        userId: req.user!.id,
      });

      return res.status(201).json({
        success: true,
        message: 'Block created successfully',
        data: block,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const pageId = req.query.pageId as string;
      if (!pageId) {
        return res.status(400).json({ success: false, error: 'pageId query parameter is required' });
      }

      const blocks = await BlockService.listByPage(pageId);
      return res.status(200).json({
        success: true,
        data: blocks,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const block = await BlockService.getById(req.params.id);
      return res.status(200).json({
        success: true,
        data: block,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const block = await BlockService.update(req.params.id, req.body.content, req.body.type);
      return res.status(200).json({
        success: true,
        message: 'Block updated successfully',
        data: block,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await BlockService.delete(req.params.id);
      return res.status(200).json({
        success: true,
        message: 'Block deleted successfully',
      });
    } catch (error) {
      return next(error);
    }
  }

  static async reorder(req: Request, res: Response, next: NextFunction) {
    try {
      const { pageId, items } = req.body;
      const reordered = await BlockService.reorderBlocks(pageId, items);

      return res.status(200).json({
        success: true,
        message: 'Blocks reordered successfully via Mongo transaction',
        data: reordered,
      });
    } catch (error) {
      return next(error);
    }
  }
}
