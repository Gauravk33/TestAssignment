import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAttachment extends Document {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  uploaderId: Types.ObjectId;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  targetType?: string;
  targetId?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const AttachmentSchema = new Schema<IAttachment>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    uploaderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    targetType: {
      type: String,
      default: null,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      default: null,
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

AttachmentSchema.index({ workspaceId: 1, createdAt: -1 });

export const Attachment = mongoose.model<IAttachment>('Attachment', AttachmentSchema);
