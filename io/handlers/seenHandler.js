import { SOCKET_EVENTS, ERROR_MESSAGES, HTTP_STATUS } from "../constants.js";
import {
  isValidObjectId,
  validateConversationMembership,
} from "../utils/validation.js";
import { emitSocketError, createSocketError } from "../utils/errorEmitter.js";
import { getConversationRoom } from "../utils/roomHelper.js";
import messageQueue from "../managers/messageQueue.js";
import Logger from "../../utils/loggerService.js";
import { markMessagesSeenService } from "../../modules/conv/services/messageService.js";

const logger = new Logger("socketSeen");

/**
 * Handle mark seen with messageId support
 * @param {Socket} socket
 * @param {string} userId
 */
export function handleMarkSeen(socket, userId) {
  socket.on(
    SOCKET_EVENTS.MARK_SEEN,
    async ({ conversationId, messageId }, callback) => {
      const companyId = socket.user?.companyId;

      // Validate conversation ID
      if (!isValidObjectId(conversationId)) {
        emitSocketError(socket, {
          message: ERROR_MESSAGES.INVALID_CONVERSATION_ID,
          code: HTTP_STATUS.BAD_REQUEST,
        });
        return;
      }

      // Validate message ID (optional - if not provided, mark all as seen)
      if (messageId && !isValidObjectId(messageId)) {
        emitSocketError(socket, {
          message: ERROR_MESSAGES.INVALID_MESSAGE_ID,
          code: HTTP_STATUS.BAD_REQUEST,
        });
        return;
      }

      // Validate conversation membership
      const result = await validateConversationMembership(
        conversationId,
        userId,
        companyId,
      );
      if (!result.valid) {
        emitSocketError(socket, {
          message: result.message,
          code: result.code,
        });
        return;
      }

      try {
        // Mark messages as seen
        await messageQueue.processMessage(conversationId, async () => {
          const seenResult = await markMessagesSeenService(
            conversationId,
            userId,
            messageId,
            companyId,
            socket.user?.role,
          );

          const roomName = getConversationRoom(conversationId);

          // Emit seen update to others in the conversation
          socket.to(roomName).emit(SOCKET_EVENTS.SEEN_UPDATE, {
            conversationId,
            userId,
            lastSeenMessageId: messageId || null,
            timestamp: new Date().toISOString(),
            count: seenResult.modifiedCount || 0,
          });

          // Acknowledge to sender
          socket.emit(SOCKET_EVENTS.SEEN_ACKNOWLEDGED, {
            conversationId,
            lastSeenMessageId: messageId || null,
            count: seenResult.modifiedCount || 0,
          });

          if (typeof callback === "function") {
            callback({
              success: true,
              count: seenResult.modifiedCount || 0,
            });
          }
        });
      } catch (error) {
        logger.error("Mark seen error:", error);

        emitSocketError(
          socket,
          createSocketError(
            ERROR_MESSAGES.FAILED_TO_MARK_SEEN,
            HTTP_STATUS.INTERNAL_ERROR,
            error,
          ),
        );

        if (typeof callback === "function") {
          callback({
            success: false,
            error: ERROR_MESSAGES.FAILED_TO_MARK_SEEN,
          });
        }
      }
    },
  );
}
