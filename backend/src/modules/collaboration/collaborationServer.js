import { Server } from 'socket.io';
import { env } from '../../config/env.js';

let io = null;

/**
 * Initialize Socket.IO server attached to the existing HTTP server.
 * CORS mirrors the Express app configuration in app.js.
 *
 * @param {import('http').Server} httpServer - The Node HTTP server created in server.js
 * @returns {Server} The Socket.IO server instance
 */
export function initializeCollaboration(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || origin === env.clientOrigin) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
    },
    path: '/socket.io',
  });

  io.on('connection', (socket) => {
    console.log(`[Collaboration]: Client connected — socket ${socket.id}`);

    socket.on('disconnect', (reason) => {
      console.log(`[Collaboration]: Client disconnected — socket ${socket.id} (${reason})`);
    });
  });

  console.log('[Collaboration]: Socket.IO server initialized');
  return io;
}

/**
 * Return the active Socket.IO server instance.
 * Returns null if initializeCollaboration has not been called yet.
 */
export function getIO() {
  return io;
}
