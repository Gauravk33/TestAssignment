import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Card } from '../models/Card.js';
import { Message } from '../models/Message.js';
import { Block } from '../models/Block.js';
import { Membership } from '../models/Membership.js';
import { Page } from '../models/Page.js';

export class StatsController {
  static async getWorkspaceStats(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.id || req.params.workspaceId || req.workspaceId;
      if (!workspaceId) {
        return res.status(400).json({ success: false, error: 'workspaceId is required' });
      }

      const wsObjectId = new Types.ObjectId(workspaceId);

      // 1. Cards per list aggregation
      const cardsByListPromise = Card.aggregate([
        { $match: { workspaceId: wsObjectId } },
        {
          $group: {
            _id: '$listId',
            count: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: 'lists',
            localField: '_id',
            foreignField: '_id',
            as: 'listInfo',
          },
        },
        { $unwind: { path: '$listInfo', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            listId: '$_id',
            listTitle: { $ifNull: ['$listInfo.title', 'Unknown List'] },
            count: 1,
            _id: 0,
          },
        },
      ]);

      // 2. Blocks by type aggregation with $facet
      const blocksByTypePromise = Block.aggregate([
        { $match: { workspaceId: wsObjectId } },
        {
          $facet: {
            byType: [
              {
                $group: {
                  _id: '$type',
                  count: { $sum: 1 },
                },
              },
              { $sort: { count: -1 } },
            ],
            totalCount: [{ $count: 'total' }],
          },
        },
      ]);

      // 3. Messages per day aggregation
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const messagesPerDayPromise = Message.aggregate([
        {
          $match: {
            workspaceId: wsObjectId,
            createdAt: { $gte: sevenDaysAgo },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // 4. Members by role aggregation
      const membersByRolePromise = Membership.aggregate([
        { $match: { workspaceId: wsObjectId } },
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 },
          },
        },
      ]);

      // 5. Pages count by type
      const pagesByTypePromise = Page.aggregate([
        { $match: { workspaceId: wsObjectId, isArchived: false } },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
          },
        },
      ]);

      const [cardsByList, blocksFacet, messagesPerDay, membersByRole, pagesByType] =
        await Promise.all([
          cardsByListPromise,
          blocksByTypePromise,
          messagesPerDayPromise,
          membersByRolePromise,
          pagesByTypePromise,
        ]);

      const blockStats = blocksFacet[0] || { byType: [], totalCount: [] };

      return res.status(200).json({
        success: true,
        data: {
          workspaceId,
          cardsByList,
          blocks: {
            total: blockStats.totalCount[0]?.total || 0,
            byType: blockStats.byType.map((b: any) => ({ type: b._id, count: b.count })),
          },
          messagesPerDay: messagesPerDay.map((m: any) => ({ date: m._id, count: m.count })),
          membersByRole: membersByRole.map((m: any) => ({ role: m._id, count: m.count })),
          pagesByType: pagesByType.map((p: any) => ({ type: p._id, count: p.count })),
        },
      });
    } catch (error) {
      return next(error);
    }
  }
}
