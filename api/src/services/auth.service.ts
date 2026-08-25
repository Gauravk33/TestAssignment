import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User, IUser } from '../models/User.js';
import { Workspace } from '../models/Workspace.js';
import { Membership, WorkspaceRole } from '../models/Membership.js';

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
}

export interface RefreshTokenPayload {
  userId: string;
  version: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
  workspaceName?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateTokens(user: IUser): AuthTokens {
    const accessPayload: TokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
    };

    const refreshPayload: RefreshTokenPayload = {
      userId: user._id.toString(),
      version: user.refreshTokenVersion || 0,
    };

    const accessToken = jwt.sign(accessPayload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as any,
    });

    const refreshToken = jwt.sign(refreshPayload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
    });

    return { accessToken, refreshToken };
  }

  static verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
  }

  static verifyRefreshToken(token: string): RefreshTokenPayload {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
  }

  static async register(dto: RegisterDTO) {
    const existingUser = await User.findOne({ email: dto.email.toLowerCase() });
    if (existingUser) {
      throw new Error('Email already registered');
    }

    const passwordHash = await this.hashPassword(dto.password);
    const user = await User.create({
      name: dto.name,
      email: dto.email.toLowerCase(),
      passwordHash,
    });

    // Create default workspace for user
    const wsName = dto.workspaceName?.trim() || `${dto.name.split(' ')[0]}'s Space`;
    const baseSlug = wsName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'workspace';
    const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;

    const workspace = await Workspace.create({
      name: wsName,
      slug,
      ownerId: user._id,
    });

    // Create owner membership
    const membership = await Membership.create({
      workspaceId: workspace._id,
      userId: user._id,
      role: 'owner',
    });

    const tokens = this.generateTokens(user);

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
      workspace: {
        id: workspace._id.toString(),
        name: workspace.name,
        slug: workspace.slug,
        icon: workspace.icon,
        role: membership.role,
      },
      ...tokens,
    };
  }

  static async login(dto: LoginDTO) {
    const user = await User.findOne({ email: dto.email.toLowerCase() }).select('+passwordHash');
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isMatch = await this.comparePassword(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    // Fetch user memberships and workspaces
    const memberships = await Membership.find({ userId: user._id }).populate('workspaceId');
    const workspaces = memberships
      .filter((m) => m.workspaceId != null)
      .map((m) => {
        const ws = m.workspaceId as any;
        return {
          id: ws._id.toString(),
          name: ws.name,
          slug: ws.slug,
          icon: ws.icon,
          role: m.role as WorkspaceRole,
        };
      });

    const tokens = this.generateTokens(user);

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
      workspaces,
      ...tokens,
    };
  }

  static async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new Error('Refresh token is required');
    }

    let payload: RefreshTokenPayload;
    try {
      payload = this.verifyRefreshToken(refreshToken);
    } catch {
      throw new Error('Invalid or expired refresh token');
    }

    const user = await User.findById(payload.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check token version for revocation support
    if (user.refreshTokenVersion !== payload.version) {
      throw new Error('Refresh token has been revoked');
    }

    // Rotate refresh token version or re-issue tokens
    const tokens = this.generateTokens(user);

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
      ...tokens,
    };
  }

  static async getMe(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const memberships = await Membership.find({ userId: user._id }).populate('workspaceId');
    const workspaces = memberships
      .filter((m) => m.workspaceId != null)
      .map((m) => {
        const ws = m.workspaceId as any;
        return {
          id: ws._id.toString(),
          name: ws.name,
          slug: ws.slug,
          icon: ws.icon,
          role: m.role as WorkspaceRole,
        };
      });

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
      workspaces,
    };
  }
}
