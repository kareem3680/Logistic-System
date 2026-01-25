import { verifyToken } from "../../utils/verifyToken.js";
import { ERROR_MESSAGES } from "../constants.js";
import Logger from "../../utils/loggerService.js";

const logger = new Logger("socketAuth");

/**
 * Socket authentication middleware
 * Validates JWT token and attaches user to socket
 * @param {Socket} socket
 * @param {Function} next
 */
export async function socketAuthMiddleware(socket, next) {
  try {
    // Extract token from auth or headers
    const authHeader =
      socket.handshake.auth?.token || socket.handshake.headers?.authorization;

    // Safe token extraction
    let token = null;
    if (authHeader) {
      if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      } else if (typeof authHeader === "string") {
        token = authHeader;
      }
    }

    if (!token) {
      return next(new Error(ERROR_MESSAGES.AUTH_REQUIRED));
    }

    // Verify token and get user
    const user = await verifyToken(token);

    if (!user) {
      return next(new Error(ERROR_MESSAGES.AUTH_FAILED));
    }

    // Additional user validation
    if (user.isBanned) {
      logger.info(`Banned user attempted connection: ${user._id}`);
      return next(new Error(ERROR_MESSAGES.AUTH_FAILED));
    }

    if (!user.isActive && user.isActive !== undefined) {
      logger.info(`Inactive user attempted connection: ${user._id}`);
      return next(new Error(ERROR_MESSAGES.AUTH_FAILED));
    }

    // Attach user to socket
    socket.user = user;

    return next();
  } catch (error) {
    logger.error("Socket authentication error:", error.message);
    return next(new Error(ERROR_MESSAGES.AUTH_FAILED));
  }
}
