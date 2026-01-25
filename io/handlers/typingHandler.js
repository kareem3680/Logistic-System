import { SOCKET_EVENTS } from "../constants.js";
import { isValidObjectId } from "../utils/validation.js";
import { getConversationRoom } from "../utils/roomHelper.js";
import typingManager from "../managers/typingManager.js";

/**
 * Handle typing indicators with auto-timeout
 * @param {Socket} socket
 * @param {string} userId
 */
export function handleTypingEvents(socket, userId) {
  // Typing start
  socket.on(SOCKET_EVENTS.TYPING, ({ conversationId }) => {
    if (!isValidObjectId(conversationId)) return;

    const roomName = getConversationRoom(conversationId);

    // Set typing with auto-stop callback
    typingManager.setTyping(conversationId, userId, (stoppedUserId) => {
      // Auto-stop callback - emit stop_typing event
      socket.to(roomName).emit(SOCKET_EVENTS.STOP_TYPING, {
        userId: stoppedUserId,
        timestamp: Date.now(),
        auto: true,
      });
    });

    // Emit typing event to others in the room
    socket.to(roomName).emit(SOCKET_EVENTS.TYPING, {
      userId,
      conversationId,
      timestamp: Date.now(),
    });
  });

  // Typing stop (manual)
  socket.on(SOCKET_EVENTS.STOP_TYPING, ({ conversationId }) => {
    if (!isValidObjectId(conversationId)) return;

    const roomName = getConversationRoom(conversationId);

    // Remove typing indicator
    typingManager.removeTyping(conversationId, userId);

    // Emit stop typing event
    socket.to(roomName).emit(SOCKET_EVENTS.STOP_TYPING, {
      userId,
      conversationId,
      timestamp: Date.now(),
      auto: false,
    });
  });
}
