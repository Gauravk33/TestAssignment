import mongoose, { Types } from 'mongoose';
import { List, IList } from '../models/List.js';
import { Card, ICard } from '../models/Card.js';
import { Page } from '../models/Page.js';
import { AuditLog } from '../models/AuditLog.js';
import { emitToPage } from '../socket.js';

export interface CreateListDTO {
  pageId: string;
  title: string;
  position?: number;
  userId: string;
}

export interface CreateCardDTO {
  listId: string;
  pageId: string;
  title: string;
  description?: string;
  position?: number;
  assigneeIds?: string[];
  dueDate?: string;
  labels?: string[];
  userId: string;
}

export interface MoveCardDTO {
  cardId: string;
  targetListId: string;
  targetPosition: number;
  userId: string;
}

export class BoardService {
  // --- LISTS ---
  static async createList(dto: CreateListDTO) {
    const page = await Page.findById(dto.pageId);
    if (!page) {
      throw new Error('Page not found');
    }

    let pos = dto.position;
    if (pos === undefined) {
      const lastList = await List.findOne({ pageId: page._id }).sort({ position: -1 });
      pos = lastList ? lastList.position + 1 : 0;
    }

    const list = await List.create({
      pageId: page._id,
      workspaceId: page.workspaceId,
      title: dto.title,
      position: pos,
      createdById: new Types.ObjectId(dto.userId),
    });

    emitToPage(dto.pageId, 'list:created', list);
    return list;
  }

  static async getListsByPage(pageId: string) {
    return List.find({ pageId: new Types.ObjectId(pageId) }).sort({ position: 1 });
  }

  static async updateList(listId: string, title?: string, position?: number) {
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (position !== undefined) updateData.position = position;

    const list = await List.findByIdAndUpdate(
      listId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!list) {
      throw new Error('List not found');
    }

    emitToPage(list.pageId.toString(), 'list:updated', list);
    return list;
  }

  static async deleteList(listId: string) {
    const list = await List.findById(listId);
    if (!list) {
      throw new Error('List not found');
    }

    await List.findByIdAndDelete(listId);
    await Card.deleteMany({ listId: list._id });

    emitToPage(list.pageId.toString(), 'list:deleted', { listId });
    return { success: true };
  }

  // --- CARDS ---
  static async createCard(dto: CreateCardDTO) {
    const list = await List.findById(dto.listId);
    if (!list) {
      throw new Error('List not found');
    }

    let pos = dto.position;
    if (pos === undefined) {
      const lastCard = await Card.findOne({ listId: list._id }).sort({ position: -1 });
      pos = lastCard ? lastCard.position + 1 : 0;
    }

    const card = await Card.create({
      listId: list._id,
      pageId: list.pageId,
      workspaceId: list.workspaceId,
      title: dto.title,
      description: dto.description || '',
      position: pos,
      assigneeIds: dto.assigneeIds?.map((id) => new Types.ObjectId(id)) || [],
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      labels: dto.labels || [],
      createdById: new Types.ObjectId(dto.userId),
    });

    emitToPage(list.pageId.toString(), 'card:created', card);
    return card;
  }

  static async getCardsByPage(pageId: string) {
    return Card.find({ pageId: new Types.ObjectId(pageId) })
      .populate('assigneeIds', 'name email avatarUrl')
      .sort({ position: 1 });
  }

  static async getCardById(cardId: string) {
    const card = await Card.findById(cardId).populate('assigneeIds', 'name email avatarUrl');
    if (!card) {
      throw new Error('Card not found');
    }
    return card;
  }

  static async updateCard(cardId: string, dto: Partial<CreateCardDTO>) {
    const updateData: any = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.dueDate !== undefined) updateData.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    if (dto.labels !== undefined) updateData.labels = dto.labels;
    if (dto.assigneeIds !== undefined) {
      updateData.assigneeIds = dto.assigneeIds.map((id) => new Types.ObjectId(id));
    }

    const card = await Card.findByIdAndUpdate(
      cardId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('assigneeIds', 'name email avatarUrl');

    if (!card) {
      throw new Error('Card not found');
    }

    emitToPage(card.pageId.toString(), 'card:updated', card);
    return card;
  }

  static async deleteCard(cardId: string) {
    const card = await Card.findByIdAndDelete(cardId);
    if (!card) {
      throw new Error('Card not found');
    }

    emitToPage(card.pageId.toString(), 'card:deleted', { cardId });
    return { success: true };
  }

  /**
   * ATOMIC CARD MOVE TRANSACTION:
   * Moves a card across lists or positions AND writes an AuditLog entry atomically in a MongoDB Session.
   */
  static async moveCard(dto: MoveCardDTO) {
    const session = await mongoose.startSession();
    let updatedCard: any;
    let fromListId: string = '';
    let toListId: string = dto.targetListId;
    let pageId: string = '';
    let workspaceId: string = '';

    try {
      await session.withTransaction(async () => {
        const card = await Card.findById(dto.cardId).session(session);
        if (!card) {
          throw new Error('Card not found');
        }

        fromListId = card.listId.toString();
        pageId = card.pageId.toString();
        workspaceId = card.workspaceId.toString();

        const oldPos = card.position;
        const newPos = dto.targetPosition;
        const isSameList = fromListId === toListId;

        // Update target card
        card.listId = new Types.ObjectId(toListId);
        card.position = newPos;
        await card.save({ session });

        // Atomic AuditLog entry within the exact same transaction
        await AuditLog.create(
          [
            {
              workspaceId: card.workspaceId,
              actorId: new Types.ObjectId(dto.userId),
              action: 'CARD_MOVED',
              targetType: 'Card',
              targetId: card._id,
              metadata: {
                cardTitle: card.title,
                fromListId,
                toListId,
                oldPosition: oldPos,
                newPosition: newPos,
                isCrossList: !isSameList,
              },
            },
          ],
          { session }
        );

        updatedCard = card;
      });

      // Emit Socket event to all clients on this board page
      emitToPage(pageId, 'card:moved', {
        card: updatedCard,
        fromListId,
        toListId,
        targetPosition: dto.targetPosition,
      });

      return updatedCard;
    } finally {
      await session.endSession();
    }
  }
}
