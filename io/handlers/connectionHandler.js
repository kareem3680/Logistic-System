import presenceManager from "../managers/presenceManager.js";
import rateLimiter from "../managers/rateLimiter.js";
import typingManager from "../managers/typingManager.js";
import { joinUserRooms } from "../utils/roomHelper.js";
import { SOCKET_EVENTS } from "../constants.js";
import Logger from "../../utils/loggerService.js";
import {
  setUserOnlineService,
  setUserOfflineService,
} from "../../modules/conv/services/presenceService.js";

const logger = new Logger("socketConnection");

/**
 * Handle new socket connection
 * @param {Server} io - Socket.io server instance
 * @param {Socket} socket - Socket instance
 */
export async function handleConnection(io, socket) {
  const userId = socket.user?._id?.toString();
  const companyId = socket.user?.companyId;

  logger.info(
    "Client connected:",
    socket.id,
    "User:",
    userId,
    "Company:",
    companyId,
  );

  if (!userId || !companyId) {
    logger.error(
      "Connection without userId or companyId - this should not happen",
    );
    socket.disconnect(true);
    return;
  }

  // Add to presence manager
  const connectionCount = presenceManager.addConnection(userId, socket.id);

  // Set user online in database (only on first connection)
  if (connectionCount === 1) {
    try {
      await setUserOnlineService(userId, companyId, socket.user?.role);

      // Broadcast to others that user is online
      socket.broadcast.emit(SOCKET_EVENTS.USER_ONLINE, {
        userId,
        companyId,
        timestamp: Date.now(),
      });
    } catch (error) {
      logger.error("Failed to set user online status:", error);
    }
  }

  // Join user-specific rooms
  joinUserRooms(socket);

  // Send initial presence data (handled by presenceHandler)
}

/**
 * Handle socket disconnection
 * @param {Server} io - Socket.io server instance
 * @param {Socket} socket - Socket instance
 */
export async function handleDisconnection(io, socket) {
  socket.on("disconnect", async (reason) => {
    const userId = socket.user?._id?.toString();
    const companyId = socket.user?.companyId;

    logger.info(
      `Client disconnected: ${socket.id}, User: ${userId}, Company: ${companyId}, Reason: ${reason}`,
    );

    if (!userId || !companyId) return;

    // Remove from presence manager
    const remainingConnections = presenceManager.removeConnection(
      userId,
      socket.id,
    );

    // Clear rate limiter for this socket
    rateLimiter.clearSocket(userId, socket.id);

    // Clear typing indicators for this user
    typingManager.clearUser(userId);

    // Set user offline in database (only if no remaining connections)
    if (remainingConnections === 0) {
      try {
        await setUserOfflineService(userId, companyId, socket.user?.role);

        // Broadcast to others that user is offline
        socket.broadcast.emit(SOCKET_EVENTS.USER_OFFLINE, {
          userId,
          companyId,
          lastSeen: new Date().toISOString(),
          timestamp: Date.now(),
        });
      } catch (error) {
        logger.error("Disconnection cleanup error:", error);
      }
    }
  });
}

/**
 * Handle ping/pong for testing
 * @param {Socket} socket
 */
export function handlePing(socket) {
  socket.on(SOCKET_EVENTS.PING, (callback) => {
    const userId = socket.user?._id?.toString();
    const companyId = socket.user?.companyId;

    if (typeof callback === "function") {
      callback({
        message: "pong",
        user: userId,
        company: companyId,
        timestamp: Date.now(),
      });
    }
  });
}

/**
 * Handle socket errors
 * @param {Socket} socket
 */
export function handleSocketErrors(socket) {
  socket.on("error", (error) => {
    logger.error("Socket error:", error);
  });
}
