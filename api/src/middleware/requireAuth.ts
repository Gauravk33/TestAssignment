import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { User } from '../models/User.js';

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please provide a valid Bearer token.',
      });
    }

    const token = authHeader.split(' ')[1];
    let payload;
    try {
      payload = AuthService.verifyAccessToken(token);
    } catch (err: any) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired access token',
        code: 'TOKEN_EXPIRED',
      });
    }

    const user = await User.findById(payload.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User belonging to this token no longer exists',
      });
    }

    req.user = {
      _id: user._id,
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      refreshTokenVersion: user.refreshTokenVersion,
    };

    return next();
  } catch (error) {
    return next(error);
  }
}
