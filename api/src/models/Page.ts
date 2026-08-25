import mongoose, { Document, Schema, Types } from 'mongoose';

export type PageType = 'doc' | 'board' | 'channel';

export interface IPage extends Document {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  title: string;
  icon?: string;
  type: PageType;
  parentId?: Types.ObjectId | null;
  position: number;
  createdById: Types.ObjectId;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PageSchema = new Schema<IPage>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Page title is required'],
      trim: true,
      maxlength: [100, 'Page title cannot exceed 100 characters'],
      default: 'Untitled',
    },
    icon: {
      type: String,
      default: '📄',
    },
    type: {
      type: String,
      enum: ['doc', 'board', 'channel'],
      required: true,
      default: 'doc',
      index: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Page',
      default: null,
      index: true,
    },
    position: {
      type: Number,
      default: 0,
    },
    createdById: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
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

// Indexes for fast tree hierarchy queries & search
PageSchema.index({ workspaceId: 1, parentId: 1, position: 1 });
PageSchema.index({ title: 'text' });

export const Page = mongoose.model<IPage>('Page', PageSchema);
