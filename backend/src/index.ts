import dotenv from 'dotenv';
// Load environment variables immediately before other modules import
dotenv.config();

import http from 'http';
import app from './app';
import { connectDB } from './config/db';
import { initSocket } from './services/socketService';

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Start Server
const startServer = async () => {
  // Connect to Database
  await connectDB();

  server.listen(PORT, () => {
    console.log(`[Server] running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

startServer().catch((err) => {
  console.error('[Server] Startup failed:', err);
});
