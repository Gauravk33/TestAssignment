import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Membership, WorkspaceRole, ROLE_HIERARCHY } from '../models/Membership.js';

export function requireRole(allowedRoles: WorkspaceRole[] | WorkspaceRole) {
  const rolesArray: WorkspaceRole[] = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required before role verification',
        });
      }

      // Resolve workspace ID from params, headers, query, or body
      const rawWorkspaceId =
        req.params.workspaceId ||
        req.params.id ||
        (req.headers['x-workspace-id'] as string) ||
        req.body?.workspaceId ||
        (req.query?.workspaceId as string);

      if (!rawWorkspaceId || !Types.ObjectId.isValid(rawWorkspaceId)) {
        return res.status(400).json({
          success: false,
          error: 'A valid workspace ID is required for role verification',
        });
      }

      const workspaceObjectId = new Types.ObjectId(rawWorkspaceId);
      const userObjectId = new Types.ObjectId(req.user.id);

      const membership = await Membership.findOne({
        workspaceId: workspaceObjectId,
        userId: userObjectId,
      });

      if (!membership) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: You are not a member of this workspace',
        });
      }

      const userRoleLevel = ROLE_HIERARCHY[membership.role] || 0;
      const minRequiredLevel = Math.min(...rolesArray.map((r) => ROLE_HIERARCHY[r] || 0));

      // Direct match or hierarchy match
      const isAllowed = rolesArray.includes(membership.role) || userRoleLevel >= minRequiredLevel;

      if (!isAllowed) {
        return res.status(403).json({
          success: false,
          error: `Insufficient permissions. Required role: [${rolesArray.join(', ')}], your role: '${membership.role}'`,
        });
      }

      req.membership = {
        _id: membership._id,
        workspaceId: membership.workspaceId,
        userId: membership.userId,
        role: membership.role,
      };
      req.workspaceId = rawWorkspaceId;

      return next();
    } catch (error) {
      return next(error);
    }
  };
}
