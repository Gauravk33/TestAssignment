import { Types } from 'mongoose';
import { Page, IPage, PageType } from '../models/Page.js';
import { Block } from '../models/Block.js';
import { List } from '../models/List.js';
import { Card } from '../models/Card.js';
import { Message } from '../models/Message.js';
import { AuditLog } from '../models/AuditLog.js';
import { CacheService } from './cache.service.js';
import { emitToWorkspace } from '../socket.js';

export interface CreatePageDTO {
  workspaceId: string;
  title: string;
  icon?: string;
  type: PageType;
  parentId?: string | null;
  userId: string;
}

export interface UpdatePageDTO {
  title?: string;
  icon?: string;
  isArchived?: boolean;
}

export interface PageTreeNode {
  id: string;
  workspaceId: string;
  title: string;
  icon: string;
  type: PageType;
  parentId: string | null;
  position: number;
  isArchived: boolean;
  children: PageTreeNode[];
}

export class PageService {
  static async create(dto: CreatePageDTO) {
    const parentObjectId = dto.parentId && Types.ObjectId.isValid(dto.parentId)
      ? new Types.ObjectId(dto.parentId)
      : null;

    // Get max position under this parent
    const lastPage = await Page.findOne({
      workspaceId: new Types.ObjectId(dto.workspaceId),
      parentId: parentObjectId,
    }).sort({ position: -1 });

    const nextPos = lastPage ? lastPage.position + 1 : 0;

    let defaultIcon = '📄';
    if (dto.type === 'board') defaultIcon = '📋';
    if (dto.type === 'channel') defaultIcon = '💬';

    const page = await Page.create({
      workspaceId: new Types.ObjectId(dto.workspaceId),
      title: dto.title || 'Untitled',
      icon: dto.icon || defaultIcon,
      type: dto.type,
      parentId: parentObjectId,
      position: nextPos,
      createdById: new Types.ObjectId(dto.userId),
    });

    // If board type, automatically create default starter lists ("To Do", "In Progress", "Done")
    if (dto.type === 'board') {
      await List.create([
        {
          pageId: page._id,
          workspaceId: page.workspaceId,
          title: 'To Do',
          position: 0,
          createdById: new Types.ObjectId(dto.userId),
        },
        {
          pageId: page._id,
          workspaceId: page.workspaceId,
          title: 'In Progress',
          position: 1,
          createdById: new Types.ObjectId(dto.userId),
        },
        {
          pageId: page._id,
          workspaceId: page.workspaceId,
          title: 'Done',
          position: 2,
          createdById: new Types.ObjectId(dto.userId),
        },
      ]);
    }

    // Invalidate Redis cache
    await CacheService.invalidateWorkspacePages(dto.workspaceId);

    // Audit log
    await AuditLog.create({
      workspaceId: page.workspaceId,
      actorId: new Types.ObjectId(dto.userId),
      action: 'PAGE_CREATED',
      targetType: 'Page',
      targetId: page._id,
      metadata: { title: page.title, type: page.type },
    });

    emitToWorkspace(dto.workspaceId, 'page:created', page);

    return page;
  }

  static async getById(pageId: string) {
    const cached = await CacheService.get<any>(CacheService.getPageKey(pageId));
    if (cached) {
      return cached;
    }

    const page = await Page.findById(pageId).populate('createdById', 'name email avatarUrl');
    if (!page) {
      throw new Error('Page not found');
    }

    await CacheService.set(CacheService.getPageKey(pageId), page, 180);
    return page;
  }

  static async getPageTree(workspaceId: string): Promise<PageTreeNode[]> {
    const cacheKey = CacheService.getPageTreeKey(workspaceId);
    const cachedTree = await CacheService.get<PageTreeNode[]>(cacheKey);
    if (cachedTree) {
      return cachedTree;
    }

    const pages = await Page.find({
      workspaceId: new Types.ObjectId(workspaceId),
      isArchived: false,
    }).sort({ position: 1, createdAt: 1 });

    const pageMap = new Map<string, PageTreeNode>();
    const rootNodes: PageTreeNode[] = [];

    // Initialize map
    pages.forEach((p) => {
      pageMap.set(p._id.toString(), {
        id: p._id.toString(),
        workspaceId: p.workspaceId.toString(),
        title: p.title,
        icon: p.icon || '📄',
        type: p.type,
        parentId: p.parentId ? p.parentId.toString() : null,
        position: p.position,
        isArchived: p.isArchived,
        children: [],
      });
    });

    // Build hierarchy
    pages.forEach((p) => {
      const node = pageMap.get(p._id.toString())!;
      if (p.parentId && pageMap.has(p.parentId.toString())) {
        pageMap.get(p.parentId.toString())!.children.push(node);
      } else {
        rootNodes.push(node);
      }
    });

    await CacheService.set(cacheKey, rootNodes, 300);
    return rootNodes;
  }

  static async update(pageId: string, dto: UpdatePageDTO, actorId: string) {
    const page = await Page.findByIdAndUpdate(
      pageId,
      { $set: dto },
      { new: true, runValidators: true }
    );

    if (!page) {
      throw new Error('Page not found');
    }

    await CacheService.invalidateWorkspacePages(page.workspaceId.toString());

    await AuditLog.create({
      workspaceId: page.workspaceId,
      actorId: new Types.ObjectId(actorId),
      action: 'PAGE_UPDATED',
      targetType: 'Page',
      targetId: page._id,
      metadata: dto,
    });

    emitToWorkspace(page.workspaceId.toString(), 'page:updated', page);

    return page;
  }

  static async move(pageId: string, newParentId: string | null, newPosition: number, actorId: string) {
    const page = await Page.findById(pageId);
    if (!page) {
      throw new Error('Page not found');
    }

    const parentObjectId = newParentId && Types.ObjectId.isValid(newParentId)
      ? new Types.ObjectId(newParentId)
      : null;

    // Prevent moving page inside itself
    if (newParentId === pageId) {
      throw new Error('Cannot set page parent to itself');
    }

    page.parentId = parentObjectId;
    page.position = newPosition !== undefined ? newPosition : page.position;
    await page.save();

    await CacheService.invalidateWorkspacePages(page.workspaceId.toString());

    await AuditLog.create({
      workspaceId: page.workspaceId,
      actorId: new Types.ObjectId(actorId),
      action: 'PAGE_MOVED',
      targetType: 'Page',
      targetId: page._id,
      metadata: { newParentId, newPosition },
    });

    emitToWorkspace(page.workspaceId.toString(), 'page:moved', page);

    return page;
  }

  static async delete(pageId: string, actorId: string) {
    const page = await Page.findById(pageId);
    if (!page) {
      throw new Error('Page not found');
    }

    const workspaceId = page.workspaceId.toString();

    // Cascading cleanups
    await Page.findByIdAndDelete(pageId);
    await Page.deleteMany({ parentId: page._id });
    await Block.deleteMany({ pageId: page._id });
    await List.deleteMany({ pageId: page._id });
    await Card.deleteMany({ pageId: page._id });
    await Message.deleteMany({ pageId: page._id });

    await CacheService.invalidateWorkspacePages(workspaceId);

    await AuditLog.create({
      workspaceId: page.workspaceId,
      actorId: new Types.ObjectId(actorId),
      action: 'PAGE_DELETED',
      targetType: 'Page',
      targetId: page._id,
      metadata: { title: page.title },
    });

    emitToWorkspace(workspaceId, 'page:deleted', { pageId });

    return { success: true };
  }
}
