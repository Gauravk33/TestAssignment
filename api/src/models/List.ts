import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IList extends Document {
  _id: Types.ObjectId;
  pageId: Types.ObjectId;
  workspaceId: Types.ObjectId;
  title: string;
  position: number;
  createdById: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ListSchema = new Schema<IList>(
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
    title: {
      type: String,
      required: [true, 'List title is required'],
      trim: true,
      maxlength: [60, 'List title cannot exceed 60 characters'],
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

ListSchema.index({ pageId: 1, position: 1 });

export const List = mongoose.model<IList>('List', ListSchema);
