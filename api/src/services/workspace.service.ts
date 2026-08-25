import { Types } from 'mongoose';
import { Workspace } from '../models/Workspace.js';
import { Membership, WorkspaceRole } from '../models/Membership.js';
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';

export interface CreateWorkspaceDTO {
  name: string;
  icon?: string;
  userId: string;
}

export interface UpdateWorkspaceDTO {
  name?: string;
  icon?: string;
}

export interface InviteMemberDTO {
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
  inviterId: string;
}

export class WorkspaceService {
  static async create(dto: CreateWorkspaceDTO) {
    const baseSlug = dto.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'workspace';
    const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;

    const workspace = await Workspace.create({
      name: dto.name,
      icon: dto.icon || '🚀',
      slug,
      ownerId: new Types.ObjectId(dto.userId),
    });

    const membership = await Membership.create({
      workspaceId: workspace._id,
      userId: new Types.ObjectId(dto.userId),
      role: 'owner',
    });

    await AuditLog.create({
      workspaceId: workspace._id,
      actorId: new Types.ObjectId(dto.userId),
      action: 'WORKSPACE_CREATED',
      targetType: 'Workspace',
      targetId: workspace._id,
      metadata: { name: workspace.name },
    });

    return {
      workspace,
      membership,
    };
  }

  static async listUserWorkspaces(userId: string) {
    const memberships = await Membership.find({ userId: new Types.ObjectId(userId) })
      .populate('workspaceId')
      .sort({ createdAt: -1 });

    return memberships
      .filter((m) => m.workspaceId != null)
      .map((m) => {
        const ws = m.workspaceId as any;
        return {
          id: ws._id.toString(),
          name: ws.name,
          slug: ws.slug,
          icon: ws.icon,
          role: m.role,
          createdAt: ws.createdAt,
        };
      });
  }

  static async getById(workspaceId: string, userId: string) {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    const membership = await Membership.findOne({
      workspaceId: workspace._id,
      userId: new Types.ObjectId(userId),
    });

    if (!membership) {
      throw new Error('Access denied: You are not a member of this workspace');
    }

    const members = await Membership.find({ workspaceId: workspace._id })
      .populate('userId', 'name email avatarUrl')
      .sort({ role: 1, createdAt: 1 });

    return {
      workspace,
      role: membership.role,
      members: members.map((m) => ({
        id: m._id.toString(),
        role: m.role,
        user: m.userId,
        joinedAt: m.createdAt,
      })),
    };
  }

  static async update(workspaceId: string, dto: UpdateWorkspaceDTO, actorId: string) {
    const workspace = await Workspace.findByIdAndUpdate(
      workspaceId,
      { $set: dto },
      { new: true, runValidators: true }
    );

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    await AuditLog.create({
      workspaceId: workspace._id,
      actorId: new Types.ObjectId(actorId),
      action: 'WORKSPACE_UPDATED',
      targetType: 'Workspace',
      targetId: workspace._id,
      metadata: dto,
    });

    return workspace;
  }

  static async delete(workspaceId: string, actorId: string) {
    const workspace = await Workspace.findByIdAndDelete(workspaceId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    await Membership.deleteMany({ workspaceId: new Types.ObjectId(workspaceId) });

    await AuditLog.create({
      workspaceId: new Types.ObjectId(workspaceId),
      actorId: new Types.ObjectId(actorId),
      action: 'WORKSPACE_DELETED',
      targetType: 'Workspace',
      targetId: workspace._id,
    });

    return { success: true };
  }

  static async inviteMember(dto: InviteMemberDTO) {
    const userToInvite = await User.findOne({ email: dto.email.toLowerCase() });
    if (!userToInvite) {
      throw new Error('User with this email is not registered on TeamSpace');
    }

    const existingMembership = await Membership.findOne({
      workspaceId: new Types.ObjectId(dto.workspaceId),
      userId: userToInvite._id,
    });

    if (existingMembership) {
      throw new Error('User is already a member of this workspace');
    }

    const membership = await Membership.create({
      workspaceId: new Types.ObjectId(dto.workspaceId),
      userId: userToInvite._id,
      role: dto.role || 'editor',
    });

    await AuditLog.create({
      workspaceId: new Types.ObjectId(dto.workspaceId),
      actorId: new Types.ObjectId(dto.inviterId),
      action: 'MEMBER_INVITED',
      targetType: 'Membership',
      targetId: membership._id,
      metadata: { invitedEmail: dto.email, role: membership.role },
    });

    return {
      membership,
      user: {
        id: userToInvite._id.toString(),
        name: userToInvite.name,
        email: userToInvite.email,
        avatarUrl: userToInvite.avatarUrl,
      },
    };
  }

  static async updateMemberRole(workspaceId: string, targetUserId: string, newRole: WorkspaceRole, actorId: string) {
    const membership = await Membership.findOne({
      workspaceId: new Types.ObjectId(workspaceId),
      userId: new Types.ObjectId(targetUserId),
    });

    if (!membership) {
      throw new Error('Membership not found in this workspace');
    }

    if (membership.role === 'owner' && newRole !== 'owner') {
      const ownerCount = await Membership.countDocuments({
        workspaceId: new Types.ObjectId(workspaceId),
        role: 'owner',
      });
      if (ownerCount <= 1) {
        throw new Error('Cannot demote the sole workspace owner');
      }
    }

    const oldRole = membership.role;
    membership.role = newRole;
    await membership.save();

    await AuditLog.create({
      workspaceId: new Types.ObjectId(workspaceId),
      actorId: new Types.ObjectId(actorId),
      action: 'MEMBER_ROLE_CHANGED',
      targetType: 'Membership',
      targetId: membership._id,
      metadata: { targetUserId, oldRole, newRole },
    });

    return membership;
  }
}
