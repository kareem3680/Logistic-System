import dotenv from "dotenv";
dotenv.config({ path: "config.env", quiet: true });

import { Server } from "socket.io";
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
} from "../modules/conv/services/presenceService.js";

// Notification service (FCM + Socket)
import { createAndSendNotificationService } from "../modules/notifications/services/notificationService.js";

// Conversation Model
import Conversation from "../modules/conv/models/conversationModel.js";

// Socket events
import { SOCKET_EVENTS } from "../utils/socketEvents.js";

let ioInstance = null;

function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: [
        process.env.MAIN_HOST_DEV,
        process.env.MAIN_HOST_PROD,
        process.env.LOCAL_HOST,
      ],
      methods: ["GET", "POST"],
    },
  });

  /* ---------------------- AUTH ---------------------- */
  io.use(async (socket, next) => {
    try {
      const authHeader = socket.handshake.headers?.authorization;
      const token =
        socket.handshake.auth?.token ||
        (authHeader && authHeader.split(" ")[1]);

      const user = await verifyToken(token);
      socket.user = user;
      next();
    } catch (err) {
      console.error("🛑 Socket auth error:", err.message);
      socket.disconnect(true);
      next(new Error("Authentication failed"));
    }
  });

  /* ---------------------- CONNECTION ---------------------- */
  io.on("connection", async (socket) => {
    const userId = socket.user?._id?.toString();
    const userRole = socket.user?.role;

    console.log("🟢 Client connected:", socket.id, "User:", userId);

    /* ---------------------- ONLINE STATUS ---------------------- */
    if (userId) {
      await setUserOnlineService(userId, socket.id);
      const presence = (await getUserPresenceService(userId)) || {};
      io.emit(SOCKET_EVENTS.USER_ONLINE, {
        userId,
        lastSeen: presence.lastSeen || null,
      });
    }

    socket.join(`user_${userId}`);
    if (userRole) socket.join(`role_${userRole}`);

    /* ---------------------- JOIN CONVERSATION ---------------------- */
    socket.on(SOCKET_EVENTS.JOIN_CONVERSATION, async ({ conversationId }) => {
      if (!conversationId || !conversationId.match(/^[0-9a-fA-F]{24}$/))
        return socket.emit("error", {
          msg: "Invalid conversationId",
          statusCode: 400,
        });

      const conv = await Conversation.findById(conversationId).select(
        "members"
      );
      if (!conv || !conv.members.map((id) => id.toString()).includes(userId)) {
        return socket.emit("error", { msg: "Unauthorized", statusCode: 403 });
      }

      socket.join(`conversation_${conversationId}`);
    });

    /* ---------------------- SEND MESSAGE ---------------------- */
    socket.on(SOCKET_EVENTS.SEND_MESSAGE, async ({ conversationId, text }) => {
      if (!conversationId || !conversationId.match(/^[0-9a-fA-F]{24}$/))
        return socket.emit("error", {
          msg: "Invalid conversationId",
          statusCode: 400,
        });

      if (!text || typeof text !== "string")
        return socket.emit("error", {
          msg: "Message text is required",
          statusCode: 400,
        });

      // ---- 1) Validate conversation & membership ----
      const conv = await Conversation.findById(conversationId).select(
        "members"
      );
      if (!conv) {
        return socket.emit("error", {
          msg: "Conversation not found",
          statusCode: 404,
        });
      }

      const participants = conv.members.map((id) => id.toString());
      if (!participants.includes(userId)) {
        return socket.emit("error", { msg: "Forbidden", statusCode: 403 });
      }

      // ---- 2) Add message ----
      const message = await addMessageService({
        conversationId,
        sender: userId,
        text,
      });

      // ---- 3) Emit to room ----
      io.to(`conversation_${conversationId}`).emit(
        SOCKET_EVENTS.NEW_MESSAGE,
        message
      );

      // ---- 4) Check offline users & send notifications ----
      const receivers = participants.filter((id) => id !== userId);

      for (const receiverId of receivers) {
        const presence = (await getUserPresenceService(receiverId)) || {};
        if (!presence.isOnline) {
          await createAndSendNotificationService({
            toUser: [receiverId],
            title: "New Message",
            message: text,
            module: "system",
            importance: "high",
            refId: conversationId,
            from: userId,
          });
        }
      }
    });

    /* ---------------------- TYPING ---------------------- */
    socket.on(SOCKET_EVENTS.TYPING, ({ conversationId }) => {
      if (!conversationId || !conversationId.match(/^[0-9a-fA-F]{24}$/)) return;

      socket
        .to(`conversation_${conversationId}`)
        .emit(SOCKET_EVENTS.TYPING, { userId });
    });

    socket.on(SOCKET_EVENTS.STOP_TYPING, ({ conversationId }) => {
      if (!conversationId || !conversationId.match(/^[0-9a-fA-F]{24}$/)) return;

      socket
        .to(`conversation_${conversationId}`)
        .emit(SOCKET_EVENTS.STOP_TYPING, { userId });
    });

    /* ---------------------- MARK SEEN ---------------------- */
    socket.on(SOCKET_EVENTS.MARK_SEEN, async ({ conversationId }) => {
      if (!conversationId || !conversationId.match(/^[0-9a-fA-F]{24}$/))
        return socket.emit("error", {
          msg: "Invalid conversationId",
          statusCode: 400,
        });

      await markMessagesSeenService(conversationId, userId);

      io.to(`conversation_${conversationId}`).emit(SOCKET_EVENTS.SEEN_UPDATE, {
        conversationId,
        userId,
      });
    });

    /* ---------------------- DISCONNECT ---------------------- */
    socket.on("disconnect", async () => {
      console.log("🔴 Client disconnected:", socket.id, "User:", userId);
      if (userId) {
        await setUserOfflineService(userId);
        const presence = (await getUserPresenceService(userId)) || {};
        io.emit(SOCKET_EVENTS.USER_OFFLINE, {
          userId,
          lastSeen: presence.lastSeen || null,
        });
      }
    });

    /* ---------------------- TESTING ---------------------- */
    socket.on("ping", () => {
      socket.emit("pong", { message: "pong", user: userId });
    });
  });

  ioInstance = io;
}

/* ---------------------- EXPORTS ---------------------- */
function getIo() {
  if (!ioInstance) throw new Error("Socket.io not initialized yet!");
  return ioInstance;
}

export { initSocket, getIo };
