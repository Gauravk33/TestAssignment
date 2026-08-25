import { io, Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(API_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected to server successfully (ID:', socket?.id, ')');
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });
  }
  return socket;
}

export function connectSocket(token: string): Socket {
  const s = getSocket();
  s.auth = { token };
  if (!s.connected) {
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
  const s = getSocket();
  const emit = () => {
    s.emit('workspace:join', workspaceId);
    s.emit('join:workspace', workspaceId);
    console.log('[Socket] Emitted join for workspace:', workspaceId);
  };
  if (s.connected) {
    emit();
  } else {
    s.once('connect', emit);
  }
}

export function joinPage(pageId: string) {
  const s = getSocket();
  const emit = () => {
    s.emit('page:join', pageId);
    s.emit('join:page', pageId);
    console.log('[Socket] Emitted join for page:', pageId);
  };
  if (s.connected) {
    emit();
  } else {
    s.once('connect', emit);
  }
}

export function leavePage(pageId: string) {
  const s = getSocket();
  if (s.connected) {
    s.emit('page:leave', pageId);
    s.emit('leave:page', pageId);
  }
}
