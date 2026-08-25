import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Page } from '../models/Page.js';
import { Block } from '../models/Block.js';
import { Card } from '../models/Card.js';
import { Message } from '../models/Message.js';

export class SearchController {
  static async search(req: Request, res: Response, next: NextFunction) {
    try {
      const q = (req.query.q as string)?.trim();
      const workspaceId = (req.query.workspaceId as string) || req.workspaceId;

      if (!q) {
        return res.status(400).json({ success: false, error: 'Query parameter q is required' });
      }
      if (!workspaceId) {
        return res.status(400).json({ success: false, error: 'workspaceId is required' });
      }

      const wsObjectId = new Types.ObjectId(workspaceId);
      const regex = new RegExp(q, 'i');

      const [pages, blocks, cards, messages] = await Promise.all([
        // Search Pages
        Page.find({
          workspaceId: wsObjectId,
          $or: [{ $text: { $search: q } }, { title: { $regex: regex } }],
          isArchived: false,
        })
          .limit(10)
          .select('title icon type position parentId createdAt'),

        // Search Blocks
        Block.find({
          workspaceId: wsObjectId,
          $or: [{ $text: { $search: q } }, { 'content.text': { $regex: regex } }],
        })
          .limit(15)
          .populate('pageId', 'title icon type')
          .select('type content pageId position createdAt'),

        // Search Cards
        Card.find({
          workspaceId: wsObjectId,
          $or: [
            { $text: { $search: q } },
            { title: { $regex: regex } },
            { description: { $regex: regex } },
          ],
        })
          .limit(15)
          .populate('listId', 'title')
          .populate('pageId', 'title icon')
          .select('title description listId pageId labels dueDate createdAt'),

        // Search Messages
        Message.find({
          workspaceId: wsObjectId,
          $or: [{ $text: { $search: q } }, { content: { $regex: regex } }],
        })
          .limit(20)
          .populate('userId', 'name email avatarUrl')
          .populate('pageId', 'title icon')
          .select('content pageId userId createdAt'),
      ]);

      const totalResults = pages.length + blocks.length + cards.length + messages.length;

      return res.status(200).json({
        success: true,
        data: {
          query: q,
          total: totalResults,
          results: {
            pages,
            blocks,
            cards,
            messages,
          },
        },
      });
    } catch (error) {
      return next(error);
    }
  }
}
