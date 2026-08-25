import { Types } from 'mongoose';
import { WorkspaceRole } from '../models/Membership.js';

export interface AuthUserPayload {
  _id: Types.ObjectId | string;
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  refreshTokenVersion?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
      membership?: {
        _id: Types.ObjectId | string;
        workspaceId: Types.ObjectId | string;
        userId: Types.ObjectId | string;
        role: WorkspaceRole;
      };
      workspaceId?: string;
    }
  }
}
