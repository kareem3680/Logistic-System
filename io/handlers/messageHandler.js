import { SOCKET_EVENTS, ERROR_MESSAGES, HTTP_STATUS } from "../constants.js";
import {
  isValidObjectId,
  validateConversationMembership,
  validateMessageText,
} from "../utils/validation.js";
import { emitSocketError, createSocketError } from "../utils/errorEmitter.js";
import presenceManager from "../managers/presenceManager.js";
import rateLimiter from "../managers/rateLimiter.js";
import messageQueue from "../managers/messageQueue.js";
import Logger from "../../utils/loggerService.js";
import { addMessageService } from "../../modules/conv/services/messageService.js";
import { createAndSendNotificationService } from "../../modules/notifications/services/notificationService.js";
import User from "../../modules/identity/models/userModel.js";

const logger = new Logger("socketMessage");

/**
 * Handle message sending with ACK
 * @param {Server} io - Socket.io server instance
 * @param {Socket} socket
 * @param {string} userId
 */
export function handleSendMessage(io, socket, userId) {
  socket.on(
    SOCKET_EVENTS.SEND_MESSAGE,
    async ({ conversationId, text, tempId }, callback) => {
      const companyId = socket.user?.companyId;

      // Validate conversation ID
      if (!isValidObjectId(conversationId)) {
        emitSocketError(socket, {
          message: ERROR_MESSAGES.INVALID_CONVERSATION_ID,
          code: HTTP_STATUS.BAD_REQUEST,
        });

        if (typeof callback === "function") {
          callback({
            success: false,
            error: ERROR_MESSAGES.INVALID_CONVERSATION_ID,
            tempId,
          });
        }
        return;
      }

      // Validate message text
      const textValidation = validateMessageText(text);
      if (!textValidation.valid) {
        emitSocketError(socket, {
          message: textValidation.message,
          code: HTTP_STATUS.BAD_REQUEST,
        });

        if (typeof callback === "function") {
          callback({
            success: false,
            error: textValidation.message,
            tempId,
          });
        }
        return;
      }

      // Check rate limit
      if (!rateLimiter.canSendMessage(userId, socket.id)) {
        emitSocketError(socket, {
          message: ERROR_MESSAGES.RATE_LIMIT_EXCEEDED,
          code: HTTP_STATUS.TOO_MANY_REQUESTS,
        });

        if (typeof callback === "function") {
          callback({
            success: false,
            error: ERROR_MESSAGES.RATE_LIMIT_EXCEEDED,
            tempId,
          });
        }
        return;
      }

      // Validate conversation membership
      const membershipResult = await validateConversationMembership(
        conversationId,
        userId,
        companyId,
      );
      if (!membershipResult.valid) {
        emitSocketError(socket, {
          message: membershipResult.message,
          code: membershipResult.code,
        });

        if (typeof callback === "function") {
          callback({
            success: false,
            error: membershipResult.message,
            tempId,
          });
        }
        return;
      }

      // Process message in queue to prevent race conditions
      try {
        await messageQueue.processMessage(conversationId, async () => {
          // Add message to database
          const message = await addMessageService({
            conversationId,
            sender: userId,
            text: textValidation.sanitized,
            companyId,
            role: socket.user?.role,
          });

          // Send ACK to sender
          if (typeof callback === "function") {
            callback({
              success: true,
              message,
              tempId,
            });
          }

          // Emit to all online members (including sender via their other devices)
          const conversation = membershipResult.conversation;
          const members = conversation.members.map((id) => id.toString());

          // Send to each online member's sockets
          for (const memberId of members) {
            if (presenceManager.isUserOnline(memberId)) {
              const memberSockets = presenceManager.getUserSockets(memberId);
              memberSockets.forEach((socketId) => {
                io.to(socketId).emit(SOCKET_EVENTS.NEW_MESSAGE, message);
              });
            }
          }

          // Send notifications to offline members (background, non-blocking)
          handleMessageNotifications(
            conversation,
            userId,
            textValidation.sanitized,
            conversationId,
            companyId,
          );
        });
      } catch (error) {
        logger.error("Message sending error:", error);

        emitSocketError(
          socket,
          createSocketError(
            ERROR_MESSAGES.FAILED_TO_SEND,
            HTTP_STATUS.INTERNAL_ERROR,
            error,
          ),
        );

        if (typeof callback === "function") {
          callback({
            success: false,
            error: ERROR_MESSAGES.FAILED_TO_SEND,
            tempId,
          });
        }
      }
    },
  );
}

/**
 * Handle notifications for offline users (non-blocking)
 * @param {Object} conversation
 * @param {string} senderId
 * @param {string} messageText
 * @param {string} conversationId
 * @param {string} companyId
 */
async function handleMessageNotifications(
  conversation,
  senderId,
  messageText,
  conversationId,
  companyId,
) {
  // Run in background
  setImmediate(async () => {
    try {
      const members = conversation.members.map((id) => id.toString());
      const receivers = members.filter((id) => id !== senderId);

      // Check who's offline
      const offlineMembers = receivers.filter(
        (id) => !presenceManager.isUserOnline(id),
      );

      if (offlineMembers.length === 0) {
        return;
      }

      // Get sender name
      const sender = await User.findOne({ _id: senderId, companyId }).select(
        "name",
      );
      const senderName = sender?.name || "Unknown";

      // Batch notification to all offline members
      await createAndSendNotificationService(
        {
          toUser: offlineMembers,
          title: `Message From ${senderName}`,
          message:
            messageText.length > 50
              ? `${messageText.substring(0, 50)}...`
              : messageText,
          module: "chat",
          importance: "high",
          refId: conversationId,
          from: senderId,
        },
        senderId,
        companyId,
        "driver",
      ); // role can be dynamic

      logger.info(
        `Sent notifications to ${offlineMembers.length} offline users in company ${companyId}`,
      );
    } catch (error) {
      logger.error("Notification error:", error);
      // Don't throw - notifications shouldn't break message sending
    }
  });
}
