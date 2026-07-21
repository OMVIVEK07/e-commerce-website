import { io, Socket } from 'socket.io-client';
import { getBaseUrl } from './api';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const apiUrl = getBaseUrl();
    const serverUrl = apiUrl.replace(/\/api\/?$/, '');

    socket = io(serverUrl, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    socket.on('connect', () => {
      console.log('[Socket.io Client] Connected with ID:', socket?.id);
    });

    socket.on('disconnect', () => {
      console.log('[Socket.io Client] Disconnected from server');
    });
  }
  return socket;
};

export const joinUserRoom = (userId: string) => {
  const s = getSocket();
  if (s && userId) {
    s.emit('join_user', userId);
  }
};

export const joinOrderRoom = (orderId: string) => {
  const s = getSocket();
  if (s && orderId) {
    s.emit('join_order', orderId);
  }
};
