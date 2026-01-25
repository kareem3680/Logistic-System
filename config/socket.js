import dotenv from "dotenv";
dotenv.config({ path: "config.env", quiet: true });

import { Server } from "socket.io";
import mongoose from "mongoose";
import { verifyToken } from "../utils/verifyToken.js";

// Chat services
import {
  addMessageService,
  markMessagesSeenService,
} from "../modules/conv/services/messageService.js";

// Presence Service
import {
  setUserOnlineService,
  setUserOfflineService,
  getUserPresenceService,
  getAllUsersPresenceService,
} from "../modules/conv/services/presenceService.js";

// Notification service
import { createAndSendNotificationService } from "../modules/notifications/services/notificationService.js";

// models
import Conversation from "../modules/conv/models/conversationModel.js";
import User from "../modules/identity/models/userModel.js";

// Socket events
import { SOCKET_EVENTS } from "../utils/socketEvents.js";

let ioInstance = null;

// Constants
const RATE_LIMIT_MS = 400; // Minimum 400ms between messages
const CONVERSATION_ROOM_PREFIX = "conversation_";
const USER_ROOM_PREFIX = "user_";
const ROLE_ROOM_PREFIX = "role_";

/* ---------------------------------------------- */
/* 🔧 Validation & Utility Functions */
/* ---------------------------------------------- */

/**
 * Validate MongoDB ObjectId
 * @param {string} id - The ID to validate
 * @returns {boolean} - True if valid
 */
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

/**
 * Validate conversation membership
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Validation result
 */
async function validateConversationMembership(conversationId, userId) {
  try {
    const conv = await Conversation.findById(conversationId).select("members");
    if (!conv) {
      return { valid: false, code: 404, message: "Conversation not found" };
    }

    const isMember = conv.members.some(
      (member) => member.toString() === userId
    );
    if (!isMember) {
      return { valid: false, code: 403, message: "Access denied" };
    }

    return { valid: true, conversation: conv };
  } catch (error) {
    console.error("Conversation validation error:", error);
    return { valid: false, code: 500, message: "Internal server error" };
  }
}

/**
 * Rate limiter for message sending
 */
class MessageRateLimiter {
  constructor(limitMs = RATE_LIMIT_MS) {
    this.limitMs = limitMs;
    this.userTimestamps = new Map();
  }

  /**
   * Check if user can send message
   * @param {string} userId - User ID
   * @returns {boolean} - True if allowed
   */
  canSendMessage(userId) {
    const now = Date.now();
    const lastTime = this.userTimestamps.get(userId) || 0;

    if (now - lastTime < this.limitMs) {
      return false;
    }

    this.userTimestamps.set(userId, now);
    return true;
  }

  /**
   * Clear user from rate limiter
   * @param {string} userId - User ID
   */
  clearUser(userId) {
    this.userTimestamps.delete(userId);
  }
}

const messageRateLimiter = new MessageRateLimiter();

/**
 * Emit error to socket
 * @param {Socket} socket - Socket instance
 * @param {Object} error - Error object
 */
function emitSocketError(socket, error) {
  socket.emit("error", {
    message: error.message || "An error occurred",
    statusCode: error.code || 500,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Join user to appropriate rooms
 * @param {Socket} socket - Socket instance
 */
function joinUserRooms(socket) {
  const userId = socket.user?._id?.toString();
  const userRole = socket.user?.role;

  if (userId) {
    socket.join(`${USER_ROOM_PREFIX}${userId}`);
    console.log(`🔵 User ${userId} joined room: ${USER_ROOM_PREFIX}${userId}`);
  }

  if (userRole) {
    socket.join(`${ROLE_ROOM_PREFIX}${userRole}`);
    console.log(
      `🔵 User ${userId} joined role room: ${ROLE_ROOM_PREFIX}${userRole}`
    );
  }
}

/* ---------------------------------------------- */
/* Socket Event Handlers */
/* ---------------------------------------------- */

/**
 * Handle conversation joining
 */
function handleJoinConversation(socket, userId) {
  socket.on(SOCKET_EVENTS.JOIN_CONVERSATION, async ({ conversationId }) => {
    if (!isValidObjectId(conversationId)) {
      return emitSocketError(socket, {
        message: "Invalid conversation ID",
        code: 400,
      });
    }

    const result = await validateConversationMembership(conversationId, userId);
    if (!result.valid) {
      return emitSocketError(socket, {
        message: result.message,
        code: result.code,
      });
    }

    const roomName = `${CONVERSATION_ROOM_PREFIX}${conversationId}`;
    socket.join(roomName);
    console.log(`📥 User ${userId} joined conversation room: ${roomName}`);
  });
}

/**
 * Handle message sending
 */
function handleSendMessage(socket, userId) {
  socket.on(SOCKET_EVENTS.SEND_MESSAGE, async ({ conversationId, text }) => {
    // Validate conversation ID
    if (!isValidObjectId(conversationId)) {
      return emitSocketError(socket, {
        message: "Invalid conversation ID",
        code: 400,
      });
    }

    // Validate message text
    if (!text || typeof text !== "string" || !text.trim()) {
      return emitSocketError(socket, {
        message: "Message text is required",
        code: 400,
      });
    }

    // Check rate limit
    if (!messageRateLimiter.canSendMessage(userId)) {
      return emitSocketError(socket, {
        message: "Too many messages, please slow down",
        code: 429,
      });
    }

    // Validate conversation membership
    const result = await validateConversationMembership(conversationId, userId);
    if (!result.valid) {
      return emitSocketError(socket, {
        message: result.message,
        code: result.code,
      });
    }

    try {
      // Add message to database
      const message = await addMessageService({
        conversationId,
        sender: userId,
        text: text.trim(),
      });

      socket.emit(SOCKET_EVENTS.NEW_MESSAGE, message);

      // Emit message to conversation room
      socket
        .to(`${CONVERSATION_ROOM_PREFIX}${conversationId}`)
        .emit(SOCKET_EVENTS.NEW_MESSAGE, message);

      // Send notifications to offline users
      await handleMessageNotifications(
        result.conversation,
        userId,
        text,
        conversationId
      );
    } catch (error) {
      console.error("Message sending error:", error);
      emitSocketError(socket, {
        message: "Failed to send message",
        code: 500,
      });
    }
  });
}

/**
 * Handle notifications for offline users
 */
async function handleMessageNotifications(
  conversation,
  senderId,
  messageText,
  conversationId
) {
  const members = conversation.members.map((id) => id.toString());
  const receivers = members.filter((id) => id !== senderId);
  const sender = await User.findById(senderId).select("name");
  const senderName = sender?.name || "Unknown";

  for (const receiverId of receivers) {
    try {
      await createAndSendNotificationService({
        toUser: [receiverId],
        title: `New Message From ${senderName}`,
        message:
          messageText.length > 50
            ? `${messageText.substring(0, 50)}...`
            : messageText,
        module: "chat",
        importance: "high",
        refId: conversationId,
        from: senderId,
      });
    } catch (error) {
      console.error(
        `Failed to send notification to user ${receiverId}:`,
        error
      );
    }
  }
}

/**
 * Handle typing indicators
 */
function handleTypingEvents(socket, userId) {
  // Typing start
  socket.on(SOCKET_EVENTS.TYPING, ({ conversationId }) => {
    if (!isValidObjectId(conversationId)) return;
    socket
      .to(`${CONVERSATION_ROOM_PREFIX}${conversationId}`)
      .emit(SOCKET_EVENTS.TYPING, {
        userId,
        timestamp: Date.now(),
      });
  });

  // Typing stop
  socket.on(SOCKET_EVENTS.STOP_TYPING, ({ conversationId }) => {
    if (!isValidObjectId(conversationId)) return;
    socket
      .to(`${CONVERSATION_ROOM_PREFIX}${conversationId}`)
      .emit(SOCKET_EVENTS.STOP_TYPING, {
        userId,
        timestamp: Date.now(),
      });
  });
}

/**
 * Handle message seen status
 */
function handleMarkSeen(socket, userId) {
  socket.on(SOCKET_EVENTS.MARK_SEEN, async ({ conversationId }) => {
    if (!isValidObjectId(conversationId)) {
      return emitSocketError(socket, {
        message: "Invalid conversation ID",
        code: 400,
      });
    }

    try {
      await markMessagesSeenService(conversationId, userId);

      socket
        .to(`${CONVERSATION_ROOM_PREFIX}${conversationId}`)
        .emit(SOCKET_EVENTS.SEEN_UPDATE, {
          conversationId,
          userId,
          timestamp: new Date().toISOString(),
        });
    } catch (error) {
      console.error("Mark seen error:", error);
      emitSocketError(socket, {
        message: "Failed to mark messages as seen",
        code: 500,
      });
    }
  });
}

/**
 * Handle disconnection
 */
async function handleDisconnection(socket, userId) {
  socket.on("disconnect", async (reason) => {
    console.log(
      `🔴 Client disconnected: ${socket.id}, User: ${userId}, Reason: ${reason}`
    );

    if (userId) {
      try {
        await setUserOfflineService(userId, socket.id);
        messageRateLimiter.clearUser(userId);

        const presence = await getUserPresenceService(userId);
        socket.broadcast.emit(SOCKET_EVENTS.USER_OFFLINE, {
          userId,
          lastSeen: presence?.lastSeen || new Date().toISOString(),
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error("Disconnection cleanup error:", error);
      }
    }
  });
}

/* ---------------------------------------------- */
/* Socket Middleware & Initialization */
/* ---------------------------------------------- */

/**
 * Socket authentication middleware
 */
async function socketAuthMiddleware(socket, next) {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(" ")[1];

    if (!token) {
      throw new Error("Authentication token required");
    }

    const user = await verifyToken(token);
    socket.user = user;
    next();
  } catch (error) {
    console.error("Socket authentication error:", error.message);
    socket.disconnect(true);
    next(new Error("Authentication failed"));
  }
}

/**
 * Handle user online status
 */
async function handleUserOnlineStatus(io, socket, userId) {
  if (userId) {
    try {
      await setUserOnlineService(userId, socket.id);
      const presence = await getUserPresenceService(userId);

      socket.broadcast.emit(SOCKET_EVENTS.USER_ONLINE, {
        userId,
        lastSeen: presence?.lastSeen || null,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("Failed to set user online status:", error);
    }
  }
}

/**
 * Initialize Socket.IO server
 * @param {http.Server} server - HTTP server instance
 */
function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: [
        process.env.MAIN_HOST_DEV,
        process.env.MAIN_HOST_PROD,
        process.env.LOCAL_HOST,
      ].filter(Boolean), // Remove undefined values
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
      skipMiddlewares: true,
    },
  });

  // Apply authentication middleware
  io.use(socketAuthMiddleware);

  // Handle new connections
  io.on("connection", async (socket) => {
    const userId = socket.user?._id?.toString();

    console.log("🟢 Client connected:", socket.id, "User:", userId);

    // Set user online status
    await handleUserOnlineStatus(io, socket, userId);

    // Join user-specific rooms
    joinUserRooms(socket);

    try {
      const presenceList = await getAllUsersPresenceService();
      socket.emit(SOCKET_EVENTS.PRESENCE_LIST, presenceList);
    } catch (e) {
      console.error("Failed to send presence list:", e);
    }

    // Register event handlers
    handleJoinConversation(socket, userId);
    handleSendMessage(socket, userId);
    handleTypingEvents(socket, userId);
    handleMarkSeen(socket, userId);
    handleDisconnection(socket, userId);

    // Test endpoint
    socket.on("ping", (callback) => {
      if (typeof callback === "function") {
        callback({
          message: "pong",
          user: userId,
          timestamp: Date.now(),
        });
      }
    });

    // Handle socket errors
    socket.on("error", (error) => {
      console.error("Socket error:", error);
    });
  });

  ioInstance = io;
  return io;
}

/**
 * Get Socket.IO instance
 * @returns {Server} Socket.IO instance
 */
function getIo() {
  if (!ioInstance) {
    throw new Error(
      "Socket.io has not been initialized. Call initSocket() first."
    );
  }
  return ioInstance;
}

export { initSocket, getIo };
