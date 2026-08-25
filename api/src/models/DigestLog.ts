import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IDigestLog extends Document {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  jobId: string;
  status: 'completed' | 'failed';
  summary: {
    cardsCount: number;
    messagesCount: number;
    blocksCount: number;
    membersCount: number;
  };
  processedAt: Date;
}

const DigestLogSchema = new Schema<IDigestLog>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    jobId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['completed', 'failed'],
      default: 'completed',
    },
    summary: {
      cardsCount: { type: Number, default: 0 },
      messagesCount: { type: Number, default: 0 },
      blocksCount: { type: Number, default: 0 },
      membersCount: { type: Number, default: 0 },
    },
    processedAt: {
      type: Date,
      default: Date.now,
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

DigestLogSchema.index({ workspaceId: 1, processedAt: -1 });

export const DigestLog = mongoose.model<IDigestLog>('DigestLog', DigestLogSchema);
