import { Types } from 'mongoose';
import { Message, IMessage } from '../models/Message.js';
import { Page } from '../models/Page.js';
import { emitToPage } from '../socket.js';

export interface CreateMessageDTO {
  pageId: string;
  content: string;
  attachments?: string[];
  parentMessageId?: string | null;
  userId: string;
}

export interface GetMessagesQuery {
  pageId: string;
  cursor?: string; // ISO date string of oldest message for cursor pagination
  limit?: number;
}

export class MessageService {
  static async create(dto: CreateMessageDTO) {
    const page = await Page.findById(dto.pageId);
    if (!page) {
      throw new Error('Channel page not found');
    }

    const message = await Message.create({
      pageId: page._id,
      workspaceId: page.workspaceId,
      userId: new Types.ObjectId(dto.userId),
      content: dto.content,
      attachments: dto.attachments || [],
      parentMessageId: dto.parentMessageId ? new Types.ObjectId(dto.parentMessageId) : null,
    });

    const populated = await Message.findById(message._id).populate('userId', 'name email avatarUrl');

    emitToPage(dto.pageId, 'channel:message', populated);

    return populated;
  }

  /**
   * Cursor-based pagination for smooth infinite scroll upwards
   */
  static async listMessages(query: GetMessagesQuery) {
    const limit = Math.min(query.limit || 30, 100);
    const filter: any = { pageId: new Types.ObjectId(query.pageId) };

    if (query.cursor) {
      filter.createdAt = { $lt: new Date(query.cursor) };
    }

    const messages = await Message.find(filter)
      .populate('userId', 'name email avatarUrl')
      .sort({ createdAt: -1 })
      .limit(limit);

    // Return in chronological order for UI display
    const orderedMessages = [...messages].reverse();
    const nextCursor = messages.length === limit ? messages[messages.length - 1].createdAt.toISOString() : null;

    return {
      messages: orderedMessages,
      nextCursor,
      hasMore: !!nextCursor,
    };
  }

  static async delete(messageId: string, userId: string) {
    const message = await Message.findOne({
      _id: new Types.ObjectId(messageId),
      userId: new Types.ObjectId(userId),
    });

    if (!message) {
      throw new Error('Message not found or not authorized to delete');
    }

    await Message.findByIdAndDelete(messageId);
    emitToPage(message.pageId.toString(), 'channel:message_deleted', { messageId });

    return { success: true };
  }
}
