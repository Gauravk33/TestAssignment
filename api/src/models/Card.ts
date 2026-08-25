import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICard extends Document {
  _id: Types.ObjectId;
  listId: Types.ObjectId;
  pageId: Types.ObjectId;
  workspaceId: Types.ObjectId;
  title: string;
  description: string;
  position: number;
  assigneeIds: Types.ObjectId[];
  dueDate?: Date | null;
  labels: string[];
  createdById: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CardSchema = new Schema<ICard>(
  {
    listId: {
      type: Schema.Types.ObjectId,
      ref: 'List',
      required: true,
      index: true,
    },
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
    title: {
      type: String,
      required: [true, 'Card title is required'],
      trim: true,
      maxlength: [150, 'Card title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      default: '',
    },
    position: {
      type: Number,
      default: 0,
      index: true,
    },
    assigneeIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    dueDate: {
      type: Date,
      default: null,
    },
    labels: [
      {
        type: String,
        trim: true,
      },
    ],
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

CardSchema.index({ listId: 1, position: 1 });
CardSchema.index({ title: 'text', description: 'text' });

export const Card = mongoose.model<ICard>('Card', CardSchema);
