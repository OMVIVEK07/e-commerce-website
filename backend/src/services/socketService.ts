import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

let io: Server | null = null;

export const initSocket = (server: HttpServer): Server => {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        return callback(null, true);
      },
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Join room for user notifications
    socket.on('join_user', (userId: string) => {
      socket.join(userId);
      console.log(`[Socket.io] Client ${socket.id} joined user room: ${userId}`);
    });

    // Join room for order tracking
    socket.on('join_order', (orderId: string) => {
      socket.join(orderId);
      console.log(`[Socket.io] Client ${socket.id} joined order room: ${orderId}`);
    });

    // Support Chat Join
    socket.on('join_chat', (userId: string) => {
      socket.join(`chat_${userId}`);
      console.log(`[Socket.io] Client ${socket.id} joined support chat room: chat_${userId}`);
    });

    // Handle typing indicator
    socket.on('typing', (data: { roomId: string; isTyping: boolean }) => {
      socket.to(data.roomId).emit('typing_status', data);
    });

    // Handle client disconnect
    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io has not been initialized. Please call initSocket first.');
  }
  return io;
};

// Send real-time updates helpers
export const notifyUser = (userId: string, event: string, data: any): void => {
  if (io) {
    io.to(userId).emit(event, data);
  }
};

export const notifyOrderUpdate = (orderId: string, status: string, data: any): void => {
  if (io) {
    io.to(orderId).emit('order_status_update', { orderId, status, data });
  }
};

export const notifyInventoryAlert = (productId: string, stock: number): void => {
  if (io) {
    io.emit('inventory_alert', { productId, stock });
  }
};
