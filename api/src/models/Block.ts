import mongoose, { Document, Schema, Types } from 'mongoose';

export type BlockType =
  | 'text'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'todo'
  | 'bullet'
  | 'code'
  | 'callout'
  | 'image';

export interface IBlock extends Document {
  _id: Types.ObjectId;
  pageId: Types.ObjectId;
  workspaceId: Types.ObjectId;
  type: BlockType;
  content: Record<string, any>;
  position: number;
  createdById: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BlockSchema = new Schema<IBlock>(
  {
    pageId: {
      type: Schema.Types.ObjectId,
      ref: 'Page',
      required: true,
      index: true,
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'text',
        'heading1',
        'heading2',
        'heading3',
        'todo',
        'bullet',
        'code',
        'callout',
        'image',
      ],
      default: 'text',
      required: true,
    },
    content: {
      type: Schema.Types.Mixed,
      default: () => ({ text: '' }),
    },
    position: {
      type: Number,
      default: 0,
      index: true,
    },
    createdById: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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

BlockSchema.index({ pageId: 1, position: 1 });
BlockSchema.index({ 'content.text': 'text' });

export const Block = mongoose.model<IBlock>('Block', BlockSchema);
