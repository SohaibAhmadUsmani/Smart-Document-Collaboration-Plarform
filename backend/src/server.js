import http from 'http';
import mongoose from 'mongoose';
import { app } from './app.js';
import { env } from './config/env.js';
import { connectDatabase, isMongoConnectivityError } from './config/database.js';
import { initializeCollaboration, getIO } from './modules/collaboration/index.js';

/**
 * @fileoverview Main entry point for the DocSync Pro backend server.
 * Handles database connection, Socket.IO real-time collaboration initialization, HTTP server listening,
 * and robust process lifecycle management including graceful shutdown on SIGTERM, SIGINT,
 * unhandledRejection, and uncaughtException.
 *
 * Yeh DocSync Pro backend server ka main entry point hai.
 * Yeh database connection banata hai, Socket.IO real-time collaboration initialize karta hai, HTTP server listen karwata hai,
 * aur process lifecycle ko behtar banata hai taake SIGTERM, SIGINT, unhandledRejection, aur uncaughtException par clean aur graceful shutdown ho sake.
 */

let server;
let isShuttingDown = false;

/**
 * Gracefully shuts down the HTTP server, Socket.IO server, and database connection.
 * Prevents hanging connections and ensures clean process termination.
 *
 * Yeh function HTTP server, Socket.IO server, aur database connection ko ba-waqar tareeqay se (gracefully) band karta hai.
 * Hanging connections ko rokta hai aur process ko cleanly terminate karta hai.
 *
 * @param {string} signal - The signal or reason triggering shutdown (e.g. 'SIGTERM', 'SIGINT', 'uncaughtException', 'unhandledRejection'). / Shutdown trigger karne wala signal ya reason.
 * @param {number} [exitCode=0] - The exit status code for the process (0 for normal exit, 1 for errors). / Process ka exit status code (0 normal exit ke liye, 1 error ke liye).
 * @returns {Promise<void>}
 */
const shutdown = async (signal, exitCode = 0) => {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;

  console.log(`[Shutdown]: Received ${signal}. Closing HTTP server and database connections...`);

  // Forced shutdown timer (10 seconds) to prevent hanging
  const forceTimer = setTimeout(() => {
    console.error('[Shutdown Error]: Forced shutdown timeout expired. Exiting immediately.');
    process.exit(1);
  }, 10000);
  forceTimer.unref?.();

  if (server) {
    const io = getIO();
    if (io) {
      io.close();
    }
    server.closeAllConnections?.();
    server.close(async () => {
      if (mongoose.connection.readyState === 1) {
        try {
          await mongoose.connection.close(false);
        } catch (dbErr) {
          console.error('[Shutdown Error]: Failed to close database connection:', dbErr);
        }
      }
      clearTimeout(forceTimer);
      console.log('[Shutdown]: Cleanup completed. Exiting.');
      process.exit(exitCode);
    });
  } else {
    if (mongoose.connection.readyState === 1) {
      try {
        await mongoose.connection.close(false);
      } catch (dbErr) {
        console.error('[Shutdown Error]: Failed to close database connection:', dbErr);
      }
    }
    clearTimeout(forceTimer);
    process.exit(exitCode);
  }
};

/**
 * Starts the DocSync Pro backend server.
 * Connects to MongoDB, sets up the HTTP server with Express and Socket.IO,
 * and includes automatic retry logic with port incrementation on EADDRINUSE conflicts (up to 3 attempts).
 *
 * Yeh function DocSync Pro backend server ko start karta hai.
 * MongoDB se connect karta hai, Express aur Socket.IO ke sath HTTP server setup karta hai,
 * aur agar port pehle se istemal mein ho (EADDRINUSE), to aglay port par automatically retry karta hai (zyada se zyada 3 dafa).
 *
 * @param {number} [port=env.port] - The network port to bind the server to. / Server bind karne ke liye target network port.
 * @param {number} [attempts=0] - Number of port conflict retries attempted so far. / Abhi tak ki gayi port conflict retries ki tadaad.
 * @returns {Promise<void>} Resolves when the server starts listening or retries. / Jab server listen karna shuru kare ya retry kare to resolve hota hai.
 */
async function startServer(port = env.port, attempts = 0) {
  try {
    await connectDatabase();
  } catch (error) {
    if (env.isProd) {
      console.error(`[Database Fatal]: Initial MongoDB connection failed in production: ${error.message}`);
      process.exit(1);
    }
    console.warn(`[Database Notice]: Running in offline mode without MongoDB (${error.message})`);
  }

  const httpServer = http.createServer(app);

  initializeCollaboration(httpServer);

  httpServer.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && attempts < 3) {
      const nextPort = port + 1;
      console.warn(`[Port Conflict]: Port ${port} is in use. Retrying on port ${nextPort}...`);
      return startServer(nextPort, attempts + 1);
    } else {
      console.error(`[Server Startup Error]:`, err);
      process.exit(1);
    }
  });

  server = httpServer.listen(port, () => {
    console.log(`🚀 DocSync Pro Backend listening on http://localhost:${port}`);
  });
}

// Graceful shutdown handlers for OS termination signals
// OS termination signals (SIGTERM aur SIGINT) ke liye graceful shutdown handlers
process.on('SIGTERM', () => shutdown('SIGTERM', 0));
process.on('SIGINT', () => shutdown('SIGINT', 0));

// Process handlers for unhandled promise rejections and uncaught exceptions to ensure safe teardown
// Unhandled promise rejections aur uncaught exceptions ko capture karke safe teardown karne ke liye handlers
process.on('unhandledRejection', (reason, promise) => {
  if (isMongoConnectivityError(reason)) {
    console.warn('[Database Notice]: Suppressed transient database unhandled rejection during reconnection:', reason?.message);
    return;
  }
  console.error('[Unhandled Rejection]: Unhandled promise rejection at:', promise, 'reason:', reason);
  shutdown('unhandledRejection', 1);
});

process.on('uncaughtException', (error) => {
  if (isMongoConnectivityError(error)) {
    console.warn('[Database Notice]: Suppressed transient database uncaught exception during reconnection:', error?.message);
    return;
  }
  console.error('[Uncaught Exception]: Uncaught exception encountered:', error);
  shutdown('uncaughtException', 1);
});

startServer();