import { Request, Response, NextFunction } from 'express';
import { PageService } from '../services/page.service.js';

export class PageController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const page = await PageService.create({
        workspaceId: req.body.workspaceId || req.workspaceId!,
        title: req.body.title,
        icon: req.body.icon,
        type: req.body.type,
        parentId: req.body.parentId,
        userId: req.user!.id,
      });

      return res.status(201).json({
        success: true,
        message: 'Page created successfully',
        data: page,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const page = await PageService.getById(req.params.id);
      return res.status(200).json({
        success: true,
        data: page,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async getTree(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = (req.query.workspaceId as string) || req.workspaceId!;
      const tree = await PageService.getPageTree(workspaceId);
      return res.status(200).json({
        success: true,
        data: tree,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await PageService.update(
        req.params.id,
        {
          title: req.body.title,
          icon: req.body.icon,
          isArchived: req.body.isArchived,
        },
        req.user!.id
      );

      return res.status(200).json({
        success: true,
        message: 'Page updated successfully',
        data: updated,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async move(req: Request, res: Response, next: NextFunction) {
    try {
      const page = await PageService.move(
        req.params.id,
        req.body.parentId ?? null,
        req.body.position,
        req.user!.id
      );

      return res.status(200).json({
        success: true,
        message: 'Page moved successfully',
        data: page,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await PageService.delete(req.params.id, req.user!.id);
      return res.status(200).json({
        success: true,
        message: 'Page deleted successfully',
      });
    } catch (error) {
      return next(error);
    }
  }
}
