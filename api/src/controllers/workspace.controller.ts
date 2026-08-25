import { Request, Response, NextFunction } from 'express';
import { WorkspaceService } from '../services/workspace.service.js';

export class WorkspaceController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await WorkspaceService.create({
        name: req.body.name,
        icon: req.body.icon,
        userId: req.user!.id,
      });

      return res.status(201).json({
        success: true,
        message: 'Workspace created successfully',
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaces = await WorkspaceService.listUserWorkspaces(req.user!.id);
      return res.status(200).json({
        success: true,
        data: workspaces,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await WorkspaceService.getById(req.params.id, req.user!.id);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await WorkspaceService.update(
        req.params.id,
        { name: req.body.name, icon: req.body.icon },
        req.user!.id
      );
      return res.status(200).json({
        success: true,
        message: 'Workspace updated successfully',
        data: updated,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await WorkspaceService.delete(req.params.id, req.user!.id);
      return res.status(200).json({
        success: true,
        message: 'Workspace deleted successfully',
      });
    } catch (error) {
      return next(error);
    }
  }

  static async invite(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await WorkspaceService.inviteMember({
        workspaceId: req.params.id,
        email: req.body.email,
        role: req.body.role,
        inviterId: req.user!.id,
      });

      return res.status(201).json({
        success: true,
        message: 'Member invited successfully',
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async updateMemberRole(req: Request, res: Response, next: NextFunction) {
    try {
      const membership = await WorkspaceService.updateMemberRole(
        req.params.id,
        req.params.userId,
        req.body.role,
        req.user!.id
      );

      return res.status(200).json({
        success: true,
        message: 'Member role updated successfully',
        data: membership,
      });
    } catch (error) {
      return next(error);
    }
  }
}
