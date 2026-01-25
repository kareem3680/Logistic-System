import Logger from "../../utils/loggerService.js";
const logger = new Logger("messageQueue");

class MessageQueue {
  constructor() {
    // Map: conversationId -> Promise chain
    this.queues = new Map();
  }

  /**
   * Process message handler in queue for a conversation
   * Ensures sequential execution to prevent race conditions
   * @param {string} conversationId
   * @param {Function} messageHandler - Async function to execute
   * @returns {Promise}
   */
  async processMessage(conversationId, messageHandler) {
    // Get or create queue for this conversation
    if (!this.queues.has(conversationId)) {
      this.queues.set(conversationId, Promise.resolve());
    }

    const currentQueue = this.queues.get(conversationId);

    // Chain the new message handler
    const newQueue = currentQueue
      .then(() => messageHandler())
      .catch((error) => {
        logger.error(
          `Message queue error for conversation ${conversationId}:`,
          error
        );
        throw error;
      });

    this.queues.set(conversationId, newQueue);

    return newQueue;
  }

  /**
   * Clear queue for a conversation
   * @param {string} conversationId
   */
  clearConversation(conversationId) {
    this.queues.delete(conversationId);
  }

  /**
   * Get statistics
   * @returns {Object}
   */
  getStats() {
    return {
      activeQueues: this.queues.size,
    };
  }

  /**
   * Clear all queues
   */
  clear() {
    this.queues.clear();
  }
}

// Singleton instance
const messageQueue = new MessageQueue();

export default messageQueue;
