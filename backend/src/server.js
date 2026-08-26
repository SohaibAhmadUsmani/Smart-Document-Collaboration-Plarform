import http from 'http';
import mongoose from 'mongoose';
import { app } from './app.js';
import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';

let server;

async function startServer(port = env.port, attempts = 0) {
  try {
    await connectDatabase();
  } catch (error) {
    console.warn(`[Database Notice]: Running in offline mode without MongoDB (${error.message})`);
  }

  const httpServer = http.createServer(app);

  httpServer.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && attempts < 3) {
      const nextPort = port + 1;
      console.warn(`[Port Conflict]: Port ${port} is in use. Retrying on port ${nextPort}...`);
      startServer(nextPort, attempts + 1);
    } else {
      console.error(`[Server Startup Error]:`, err);
      process.exit(1);
    }
  });

  server = httpServer.listen(port, () => {
    console.log(`🚀 DocSync Pro Backend listening on http://localhost:${port}`);
  });

  // Graceful shutdown handlers
  const shutdown = async (signal) => {
    console.log(`[Shutdown]: Received ${signal}. Closing HTTP server and database connections...`);
    if (server) {
      server.close(async () => {
        if (mongoose.connection.readyState === 1) {
          await mongoose.connection.close(false);
        }
        console.log('[Shutdown]: Cleanup completed. Exiting.');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer();