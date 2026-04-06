import dotenv from "dotenv";
dotenv.config({ path: "config.env", quiet: true });

import Logger from "../utils/loggerService.js";
const logger = new Logger("socketMain");

import { Server } from "socket.io";
import { SOCKET_CONFIG } from "./constants.js";
import { socketAuthMiddleware } from "./middleware/auth.js";
import {
  handleConnection,
  handleDisconnection,
  handlePing,
  handleSocketErrors,
} from "./handlers/connectionHandler.js";
import {
  handleJoinConversation,
  handleLeaveConversation,
} from "./handlers/conversationHandler.js";
import { handleSendMessage } from "./handlers/messageHandler.js";
import { handleTypingEvents } from "./handlers/typingHandler.js";
import { handleMarkSeen } from "./handlers/seenHandler.js";
import { sendPresenceList } from "./handlers/presenceHandler.js";
import presenceManager from "./managers/presenceManager.js";
import rateLimiter from "./managers/rateLimiter.js";
import typingManager from "./managers/typingManager.js";
import messageQueue from "./managers/messageQueue.js";
import { setUserOfflineService } from "../modules/conv/services/presenceService.js";

let ioInstance = null;

/**
 * Initialize Socket.IO server with all handlers
 * @param {http.Server} server - HTTP server instance
 * @returns {Server} Socket.IO instance
 */
function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: [
        process.env.MAIN_HOST_DEV,
        process.env.MAIN_HOST_PROD,
        process.env.LOCAL_HOST,
      ].filter(Boolean),
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: SOCKET_CONFIG.PING_TIMEOUT,
    pingInterval: SOCKET_CONFIG.PING_INTERVAL,
    connectionStateRecovery: {
      maxDisconnectionDuration: SOCKET_CONFIG.MAX_DISCONNECTION_DURATION,
      skipMiddlewares: false, // CRITICAL: Must re-authenticate on recovery
    },
  });

  // Apply authentication middleware
  io.use(socketAuthMiddleware);

  // Handle new connections
  io.on("connection", async (socket) => {
    const userId = socket.user?._id?.toString();

    // Initialize connection
    await handleConnection(io, socket);

    // Send scoped presence list
    await sendPresenceList(socket, userId);

    // Register all event handlers
    handleJoinConversation(socket, userId);
    handleLeaveConversation(socket, userId);
    handleSendMessage(io, socket, userId);
    handleTypingEvents(socket, userId);
    handleMarkSeen(socket, userId);
    handleDisconnection(io, socket);
    handlePing(socket);
    handleSocketErrors(socket);
  });

  // Graceful shutdown handler
  setupGracefulShutdown(io);

  ioInstance = io;

  return io;
}

/**
 * Setup graceful shutdown on SIGTERM/SIGINT
 * @param {Server} io
 */
function setupGracefulShutdown(io) {
  const shutdown = async (signal) => {
    logger.info(`\n${signal} received, starting graceful shutdown...`);

    try {
      // Get all connected sockets
      const sockets = await io.fetchSockets();
      logger.info(`Cleaning up ${sockets.length} active connections...`);

      // Mark all users as offline
      const offlinePromises = sockets.map(async (socket) => {
        const userId = socket.user?._id?.toString();
        if (userId) {
          try {
            await setUserOfflineService(userId, socket.id);
            presenceManager.removeConnection(userId, socket.id);
          } catch (error) {
            logger.error(`Failed to set user ${userId} offline:`, error);
          }
        }
      });

      await Promise.allSettled(offlinePromises);

      // Clean up managers
      rateLimiter.destroy();
      typingManager.clear();
      messageQueue.clear();

      // Close socket.io server
      io.close(() => {
        logger.info("Socket.IO server closed");
        process.exit(0);
      });

      // Force exit after 10 seconds if graceful shutdown fails
      setTimeout(() => {
        logger.error("Forced shutdown after timeout");
        process.exit(1);
      }, 10000);
    } catch (error) {
      logger.error("Error during shutdown:", error);
      process.exit(1);
    }
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

/**
 * Get Socket.IO instance
 * @returns {Server} Socket.IO instance
 * @throws {Error} If socket.io not initialized
 */
function getIo() {
  if (!ioInstance) {
    throw new Error(
      "Socket.io has not been initialized. Call initSocket() first.",
    );
  }
  return ioInstance;
}

export { initSocket, getIo };
