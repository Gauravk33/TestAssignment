import { Types } from 'mongoose';
import { Comment, IComment, CommentTargetType } from '../models/Comment.js';
import { emitToWorkspace } from '../socket.js';

export interface CreateCommentDTO {
  targetType: CommentTargetType;
  targetId: string;
  workspaceId: string;
  content: string;
  parentId?: string | null;
  userId: string;
}

export class CommentService {
  static async create(dto: CreateCommentDTO) {
    const comment = await Comment.create({
      targetType: dto.targetType,
      targetId: new Types.ObjectId(dto.targetId),
      workspaceId: new Types.ObjectId(dto.workspaceId),
      userId: new Types.ObjectId(dto.userId),
      content: dto.content,
      parentId: dto.parentId ? new Types.ObjectId(dto.parentId) : null,
    });

    const populated = await Comment.findById(comment._id).populate('userId', 'name email avatarUrl');

    emitToWorkspace(dto.workspaceId, 'comment:created', populated);

    return populated;
  }

  static async listByTarget(targetId: string, targetType?: CommentTargetType) {
    const filter: any = { targetId: new Types.ObjectId(targetId) };
    if (targetType) {
      filter.targetType = targetType;
    }

    const comments = await Comment.find(filter)
      .populate('userId', 'name email avatarUrl')
      .sort({ createdAt: 1 });

    return comments;
  }

  static async update(commentId: string, content: string, userId: string) {
    const comment = await Comment.findOneAndUpdate(
      {
        _id: new Types.ObjectId(commentId),
        userId: new Types.ObjectId(userId),
      },
      { $set: { content } },
      { new: true, runValidators: true }
    ).populate('userId', 'name email avatarUrl');

    if (!comment) {
      throw new Error('Comment not found or not authorized to edit');
    }

    emitToWorkspace(comment.workspaceId.toString(), 'comment:updated', comment);

    return comment;
  }

  static async delete(commentId: string, userId: string) {
    const comment = await Comment.findOne({
      _id: new Types.ObjectId(commentId),
      userId: new Types.ObjectId(userId),
    });

    if (!comment) {
      throw new Error('Comment not found or not authorized to delete');
    }

    await Comment.findByIdAndDelete(commentId);
    await Comment.deleteMany({ parentId: comment._id });

    emitToWorkspace(comment.workspaceId.toString(), 'comment:deleted', { commentId });

    return { success: true };
  }
}
