import { SOCKET_EVENTS, ERROR_MESSAGES, HTTP_STATUS } from "../constants.js";
import {
  isValidObjectId,
  validateConversationMembership,
} from "../utils/validation.js";
import { emitSocketError } from "../utils/errorEmitter.js";
import Logger from "../../utils/loggerService.js";
import {
  getConversationRoom,
  leaveAllConversationRooms,
} from "../utils/roomHelper.js";

const logger = new Logger("socketConversation");

/**
 * Handle conversation joining
 * @param {Socket} socket
 * @param {string} userId
 */
export function handleJoinConversation(socket, userId) {
  socket.on(SOCKET_EVENTS.JOIN_CONVERSATION, async ({ conversationId }) => {
    // Validate conversation ID
    if (!isValidObjectId(conversationId)) {
      return emitSocketError(socket, {
        message: ERROR_MESSAGES.INVALID_CONVERSATION_ID,
        code: HTTP_STATUS.BAD_REQUEST,
      });
    }

    // Validate membership
    const result = await validateConversationMembership(conversationId, userId);
    if (!result.valid) {
      return emitSocketError(socket, {
        message: result.message,
        code: result.code,
      });
    }

    const roomName = getConversationRoom(conversationId);

    // Leave all previous conversation rooms first
    leaveAllConversationRooms(socket);

    // Join new room
    socket.join(roomName);
    logger.info(`User ${userId} joined conversation room: ${roomName}`);

    // Acknowledge join
    socket.emit(SOCKET_EVENTS.CONVERSATION_JOINED, {
      conversationId,
      timestamp: Date.now(),
    });
  });
}

/**
 * Handle leaving a conversation
 * @param {Socket} socket
 * @param {string} userId
 */
export function handleLeaveConversation(socket, userId) {
  socket.on(SOCKET_EVENTS.LEAVE_CONVERSATION, ({ conversationId }) => {
    if (!isValidObjectId(conversationId)) {
      return;
    }

    const roomName = getConversationRoom(conversationId);
    socket.leave(roomName);
    logger.info(`User ${userId} left conversation room: ${roomName}`);

    // Acknowledge leave
    socket.emit(SOCKET_EVENTS.CONVERSATION_LEFT, {
      conversationId,
      timestamp: Date.now(),
    });
  });
}
