import { SOCKET_CONFIG } from "../constants.js";
import Logger from "../../utils/loggerService.js";

const logger = new Logger("typingManager");

class TypingManager {
  constructor(timeoutMs = SOCKET_CONFIG.TYPING_TIMEOUT_MS) {
    this.timeoutMs = timeoutMs;

    // Map: conversationId -> Map(userId -> timeout)
    this.typingUsers = new Map();
  }

  /**
   * Set user as typing in a conversation
   * @param {string} conversationId
   * @param {string} userId
   * @param {Function} onTimeout - Callback when auto-stopped
   */
  setTyping(conversationId, userId, onTimeout) {
    if (!this.typingUsers.has(conversationId)) {
      this.typingUsers.set(conversationId, new Map());
    }

    const conversationTyping = this.typingUsers.get(conversationId);

    // Clear existing timeout
    if (conversationTyping.has(userId)) {
      clearTimeout(conversationTyping.get(userId));
    }

    // Set new timeout for auto-stop
    const timeout = setTimeout(() => {
      this.removeTyping(conversationId, userId);

      // Call callback to emit stop_typing event
      if (typeof onTimeout === "function") {
        onTimeout(userId);
      }

      logger.info(
        `⏱Auto-stopped typing for user ${userId} in conversation ${conversationId}`
      );
    }, this.timeoutMs);

    conversationTyping.set(userId, timeout);
  }

  /**
   * Remove typing indicator for user
   * @param {string} conversationId
   * @param {string} userId
   */
  removeTyping(conversationId, userId) {
    if (!this.typingUsers.has(conversationId)) {
      return;
    }

    const conversationTyping = this.typingUsers.get(conversationId);
    const timeout = conversationTyping.get(userId);

    if (timeout) {
      clearTimeout(timeout);
      conversationTyping.delete(userId);
    }

    // Clean up empty conversation maps
    if (conversationTyping.size === 0) {
      this.typingUsers.delete(conversationId);
    }
  }

  /**
   * Clear all typing indicators for a user (on disconnect)
   * @param {string} userId
   */
  clearUser(userId) {
    for (const [conversationId, users] of this.typingUsers.entries()) {
      if (users.has(userId)) {
        this.removeTyping(conversationId, userId);
      }
    }
  }

  /**
   * Get all users currently typing in a conversation
   * @param {string} conversationId
   * @returns {string[]}
   */
  getTypingUsers(conversationId) {
    if (!this.typingUsers.has(conversationId)) {
      return [];
    }

    return Array.from(this.typingUsers.get(conversationId).keys());
  }

  /**
   * Check if user is typing in a conversation
   * @param {string} conversationId
   * @param {string} userId
   * @returns {boolean}
   */
  isTyping(conversationId, userId) {
    return this.typingUsers.get(conversationId)?.has(userId) || false;
  }

  /**
   * Get statistics
   * @returns {Object}
   */
  getStats() {
    let totalTyping = 0;
    for (const users of this.typingUsers.values()) {
      totalTyping += users.size;
    }

    return {
      activeConversations: this.typingUsers.size,
      totalTypingUsers: totalTyping,
    };
  }

  /**
   * Clear all typing data
   */
  clear() {
    for (const users of this.typingUsers.values()) {
      for (const timeout of users.values()) {
        clearTimeout(timeout);
      }
    }
    this.typingUsers.clear();
  }
}

// Singleton instance
const typingManager = new TypingManager();

export default typingManager;
