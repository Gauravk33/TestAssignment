import { Request, Response, NextFunction } from 'express';
import { BoardService } from '../services/board.service.js';

export class BoardController {
  // --- LISTS ---
  static async createList(req: Request, res: Response, next: NextFunction) {
    try {
      const list = await BoardService.createList({
        pageId: req.body.pageId,
        title: req.body.title,
        position: req.body.position,
        userId: req.user!.id,
      });

      return res.status(201).json({
        success: true,
        message: 'List created successfully',
        data: list,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async getLists(req: Request, res: Response, next: NextFunction) {
    try {
      const pageId = req.query.pageId as string;
      if (!pageId) {
        return res.status(400).json({ success: false, error: 'pageId is required' });
      }

      const lists = await BoardService.getListsByPage(pageId);
      return res.status(200).json({
        success: true,
        data: lists,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async updateList(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await BoardService.updateList(req.params.id, req.body.title, req.body.position);
      return res.status(200).json({
        success: true,
        message: 'List updated successfully',
        data: updated,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async deleteList(req: Request, res: Response, next: NextFunction) {
    try {
      await BoardService.deleteList(req.params.id);
      return res.status(200).json({
        success: true,
        message: 'List deleted successfully',
      });
    } catch (error) {
      return next(error);
    }
  }

  // --- CARDS ---
  static async createCard(req: Request, res: Response, next: NextFunction) {
    try {
      const card = await BoardService.createCard({
        listId: req.body.listId,
        pageId: req.body.pageId,
        title: req.body.title,
        description: req.body.description,
        position: req.body.position,
        assigneeIds: req.body.assigneeIds,
        dueDate: req.body.dueDate,
        labels: req.body.labels,
        userId: req.user!.id,
      });

      return res.status(201).json({
        success: true,
        message: 'Card created successfully',
        data: card,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async getCards(req: Request, res: Response, next: NextFunction) {
    try {
      const pageId = req.query.pageId as string;
      if (!pageId) {
        return res.status(400).json({ success: false, error: 'pageId is required' });
      }

      const cards = await BoardService.getCardsByPage(pageId);
      return res.status(200).json({
        success: true,
        data: cards,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async getCardById(req: Request, res: Response, next: NextFunction) {
    try {
      const card = await BoardService.getCardById(req.params.id);
      return res.status(200).json({
        success: true,
        data: card,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async updateCard(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await BoardService.updateCard(req.params.id, req.body);
      return res.status(200).json({
        success: true,
        message: 'Card updated successfully',
        data: updated,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async deleteCard(req: Request, res: Response, next: NextFunction) {
    try {
      await BoardService.deleteCard(req.params.id);
      return res.status(200).json({
        success: true,
        message: 'Card deleted successfully',
      });
    } catch (error) {
      return next(error);
    }
  }

  static async moveCard(req: Request, res: Response, next: NextFunction) {
    try {
      const movedCard = await BoardService.moveCard({
        cardId: req.params.id,
        targetListId: req.body.targetListId,
        targetPosition: req.body.targetPosition,
        userId: req.user!.id,
      });

      return res.status(200).json({
        success: true,
        message: 'Card moved successfully via Mongo transaction + AuditLog recorded',
        data: movedCard,
      });
    } catch (error) {
      return next(error);
    }
  }
}
