import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { env } from '../config/env.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: (env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password, workspaceName } = req.body;
      const result = await AuthService.register({ name, email, password, workspaceName });

      res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);

      return res.status(201).json({
        success: true,
        message: 'Account registered successfully',
        data: {
          user: result.user,
          workspace: result.workspace,
          accessToken: result.accessToken,
        },
      });
    } catch (error: any) {
      if (error.message === 'Email already registered') {
        return res.status(409).json({ success: false, error: error.message });
      }
      return next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login({ email, password });

      res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);

      return res.status(200).json({
        success: true,
        message: 'Logged in successfully',
        data: {
          user: result.user,
          workspaces: result.workspaces,
          accessToken: result.accessToken,
        },
      });
    } catch (error: any) {
      if (error.message === 'Invalid email or password') {
        return res.status(401).json({ success: false, error: error.message });
      }
      return next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies?.refreshToken || req.body?.refreshToken;
      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'Refresh token not found in cookies or body',
        });
      }

      const result = await AuthService.refresh(token);

      res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);

      return res.status(200).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error: any) {
      res.clearCookie('refreshToken', COOKIE_OPTIONS);
      return res.status(401).json({
        success: false,
        error: error.message || 'Failed to refresh token',
      });
    }
  }

  static async logout(_req: Request, res: Response) {
    res.clearCookie('refreshToken', COOKIE_OPTIONS);
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  }

  static async me(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.getMe(req.user!.id);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }
}
