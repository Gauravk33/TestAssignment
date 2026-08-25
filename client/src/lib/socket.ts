import { io, Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(API_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export function connectSocket(token: string): Socket {
  const s = getSocket();
  if (!s.connected) {
    s.auth = { token };
    s.connect();
  }
  return s;
}

export function disconnectSocket() {
  if (socket?.connected) {
    socket.disconnect();
  }
}

export function joinWorkspace(workspaceId: string) {
  getSocket().emit('join:workspace', workspaceId);
}

export function joinPage(pageId: string) {
  getSocket().emit('join:page', pageId);
}

export function leavePage(pageId: string) {
  getSocket().emit('leave:page', pageId);
}
