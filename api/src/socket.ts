import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { AuthService } from './services/auth.service.js';
import { env } from './config/env.js';

let io: Server;

export function initSocket(server: HttpServer): Server {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        callback(null, true);
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

    const handleJoinWorkspace = (workspaceId: string) => {
      socket.join(`workspace:${workspaceId}`);
      console.log(`[Socket] ${socket.id} joined room workspace:${workspaceId}`);
    };

    const handleLeaveWorkspace = (workspaceId: string) => {
      socket.leave(`workspace:${workspaceId}`);
      console.log(`[Socket] ${socket.id} left room workspace:${workspaceId}`);
    };

    const handleJoinPage = (pageId: string) => {
      socket.join(`page:${pageId}`);
      console.log(`[Socket] ${socket.id} joined room page:${pageId}`);
    };

    const handleLeavePage = (pageId: string) => {
      socket.leave(`page:${pageId}`);
      console.log(`[Socket] ${socket.id} left room page:${pageId}`);
    };

    // Support both event naming conventions
    socket.on('workspace:join', handleJoinWorkspace);
    socket.on('join:workspace', handleJoinWorkspace);

    socket.on('workspace:leave', handleLeaveWorkspace);
    socket.on('leave:workspace', handleLeaveWorkspace);

    socket.on('page:join', handleJoinPage);
    socket.on('join:page', handleJoinPage);

    socket.on('page:leave', handleLeavePage);
    socket.on('leave:page', handleLeavePage);

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
    console.log(`[Socket] Emitting '${event}' to workspace:${workspaceId}`);
    io.to(`workspace:${workspaceId}`).emit(event, data);
  }
}

export function emitToPage(pageId: string, event: string, data: any) {
  if (io) {
    console.log(`[Socket] Emitting '${event}' to page:${pageId}`);
    io.to(`page:${pageId}`).emit(event, data);
  }
}
