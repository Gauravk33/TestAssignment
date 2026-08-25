import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { AuthService } from './services/auth.service.js';
import { env } from './config/env.js';

let io: Server;

export function initSocket(server: HttpServer): Server {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || origin === env.CLIENT_URL || origin.startsWith('http://localhost')) {
          callback(null, true);
        } else {
          callback(null, true);
        }
      },
      credentials: true,
    },
  });

  // JWT Handshake Middleware
  io.use((socket: Socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
      socket.handshake.query?.token;

    if (!token || typeof token !== 'string') {
      return next(new Error('Authentication error: Missing token'));
    }

    try {
      const payload = AuthService.verifyAccessToken(token);
      (socket as any).user = payload;
      return next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    console.log(`[Socket] User connected: ${user?.name || socket.id} (${socket.id})`);

    // Join Workspace Room
    socket.on('workspace:join', (workspaceId: string) => {
      socket.join(`workspace:${workspaceId}`);
      console.log(`[Socket] ${socket.id} joined workspace:${workspaceId}`);
    });

    // Leave Workspace Room
    socket.on('workspace:leave', (workspaceId: string) => {
      socket.leave(`workspace:${workspaceId}`);
      console.log(`[Socket] ${socket.id} left workspace:${workspaceId}`);
    });

    // Join Page Room
    socket.on('page:join', (pageId: string) => {
      socket.join(`page:${pageId}`);
      console.log(`[Socket] ${socket.id} joined page:${pageId}`);
    });

    // Leave Page Room
    socket.on('page:leave', (pageId: string) => {
      socket.leave(`page:${pageId}`);
      console.log(`[Socket] ${socket.id} left page:${pageId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.io has not been initialized yet!');
  }
  return io;
}

export function emitToWorkspace(workspaceId: string, event: string, data: any) {
  if (io) {
    io.to(`workspace:${workspaceId}`).emit(event, data);
  }
}

export function emitToPage(pageId: string, event: string, data: any) {
  if (io) {
    io.to(`page:${pageId}`).emit(event, data);
  }
}
