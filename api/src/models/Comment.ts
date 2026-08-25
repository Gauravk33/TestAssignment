import mongoose, { Document, Schema, Types } from 'mongoose';

export type CommentTargetType = 'page' | 'block' | 'card';

export interface IComment extends Document {
  _id: Types.ObjectId;
  targetType: CommentTargetType;
  targetId: Types.ObjectId;
  workspaceId: Types.ObjectId;
  userId: Types.ObjectId;
  content: string;
  parentId?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    targetType: {
      type: String,
      enum: ['page', 'block', 'card'],
      required: true,
      index: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Comment content cannot be empty'],
      trim: true,
      maxlength: [2000, 'Comment cannot exceed 2000 characters'],
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

CommentSchema.index({ targetId: 1, targetType: 1, createdAt: 1 });

export const Comment = mongoose.model<IComment>('Comment', CommentSchema);
