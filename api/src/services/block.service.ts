import mongoose, { Types } from 'mongoose';
import { Block, IBlock, BlockType } from '../models/Block.js';
import { Page } from '../models/Page.js';
import { emitToPage } from '../socket.js';

export interface CreateBlockDTO {
  pageId: string;
  type: BlockType;
  content: Record<string, any>;
  position?: number;
  userId: string;
}

export interface ReorderBlockItem {
  id: string;
  position: number;
}

export class BlockService {
  static async create(dto: CreateBlockDTO) {
    const page = await Page.findById(dto.pageId);
    if (!page) {
      throw new Error('Page not found');
    }

    let pos = dto.position;
    if (pos === undefined) {
      const lastBlock = await Block.findOne({ pageId: page._id }).sort({ position: -1 });
      pos = lastBlock ? lastBlock.position + 1 : 0;
    }

    const block = await Block.create({
      pageId: page._id,
      workspaceId: page.workspaceId,
      type: dto.type,
      content: dto.content || { text: '' },
      position: pos,
      createdById: new Types.ObjectId(dto.userId),
    });

    emitToPage(dto.pageId, 'block:created', block);

    return block;
  }

  static async listByPage(pageId: string) {
    return Block.find({ pageId: new Types.ObjectId(pageId) }).sort({ position: 1, createdAt: 1 });
  }

  static async getById(blockId: string) {
    const block = await Block.findById(blockId);
    if (!block) {
      throw new Error('Block not found');
    }
    return block;
  }

  static async update(blockId: string, content: Record<string, any>, type?: BlockType) {
    const updateData: any = { content };
    if (type) updateData.type = type;

    const block = await Block.findByIdAndUpdate(
      blockId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!block) {
      throw new Error('Block not found');
    }

    emitToPage(block.pageId.toString(), 'block:updated', block);

    return block;
  }

  static async delete(blockId: string) {
    const block = await Block.findByIdAndDelete(blockId);
    if (!block) {
      throw new Error('Block not found');
    }

    emitToPage(block.pageId.toString(), 'block:deleted', { blockId });

    return { success: true };
  }

  /**
   * Reorder blocks atomically wrapped in a MongoDB transaction
   */
  static async reorderBlocks(pageId: string, items: ReorderBlockItem[]) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        for (const item of items) {
          await Block.updateOne(
            { _id: new Types.ObjectId(item.id), pageId: new Types.ObjectId(pageId) },
            { $set: { position: item.position } },
            { session }
          );
        }
      });

      const updatedBlocks = await Block.find({ pageId: new Types.ObjectId(pageId) }).sort({ position: 1 });
      emitToPage(pageId, 'block:reordered', { pageId, blocks: updatedBlocks });

      return updatedBlocks;
    } finally {
      await session.endSession();
    }
  }
}
