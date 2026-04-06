import Logger from "../../utils/loggerService.js";
const logger = new Logger("presenceManager");

class PresenceManager {
  constructor() {
    // Map: userId -> Set<socketId>
    this.userConnections = new Map();
    // Map: socketId -> userId (for reverse lookup)
    this.socketToUser = new Map();
  }

  /**
   * Add a socket connection for a user
   * @param {string} userId
   * @param {string} socketId
   * @returns {number} - Total connection count for user
   */
  addConnection(userId, socketId) {
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }

    this.userConnections.get(userId).add(socketId);
    this.socketToUser.set(socketId, userId);

    const count = this.userConnections.get(userId).size;

    logger.info(
      `Presence: User ${userId} added socket ${socketId} (total: ${count})`,
    );

    return count;
  }

  /**
   * Remove a socket connection for a user
   * @param {string} userId
   * @param {string} socketId
   * @returns {number} - Remaining connection count for user
   */
  removeConnection(userId, socketId) {
    if (!this.userConnections.has(userId)) {
      return 0;
    }

    const userSockets = this.userConnections.get(userId);
    userSockets.delete(socketId);
    this.socketToUser.delete(socketId);

    const remaining = userSockets.size;

    if (remaining === 0) {
      this.userConnections.delete(userId);
    }

    logger.info(
      `Presence: User ${userId} removed socket ${socketId} (remaining: ${remaining})`,
    );

    return remaining;
  }

  /**
   * Get user ID by socket ID
   * @param {string} socketId
   * @returns {string|null}
   */
  getUserIdBySocket(socketId) {
    return this.socketToUser.get(socketId) || null;
  }

  /**
   * Check if user is online (has any active connections)
   * @param {string} userId
   * @returns {boolean}
   */
  isUserOnline(userId) {
    return (
      this.userConnections.has(userId) &&
      this.userConnections.get(userId).size > 0
    );
  }

  /**
   * Get all socket IDs for a user
   * @param {string} userId
   * @returns {Set<string>}
   */
  getUserSockets(userId) {
    return this.userConnections.get(userId) || new Set();
  }

  /**
   * Get connection count for a user
   * @param {string} userId
   * @returns {number}
   */
  getConnectionCount(userId) {
    return this.userConnections.get(userId)?.size || 0;
  }

  /**
   * Get total online users count
   * @returns {number}
   */
  getOnlineUsersCount() {
    return this.userConnections.size;
  }

  /**
   * Get all online user IDs
   * @returns {string[]}
   */
  getAllOnlineUserIds() {
    return Array.from(this.userConnections.keys());
  }

  /**
   * Clear all connections for a user
   * @param {string} userId
   */
  clearUser(userId) {
    const sockets = this.userConnections.get(userId);
    if (sockets) {
      for (const socketId of sockets) {
        this.socketToUser.delete(socketId);
      }
    }
    const cleared = this.userConnections.delete(userId);
    if (cleared) {
      logger.info(`Presence: Cleared all connections for user ${userId}`);
    }
  }

  /**
   * Get statistics
   * @returns {Object}
   */
  getStats() {
    let totalSockets = 0;
    for (const sockets of this.userConnections.values()) {
      totalSockets += sockets.size;
    }

    return {
      onlineUsers: this.userConnections.size,
      totalSockets,
      avgSocketsPerUser:
        this.userConnections.size > 0
          ? (totalSockets / this.userConnections.size).toFixed(2)
          : 0,
    };
  }
}

// Singleton instance
const presenceManager = new PresenceManager();

export default presenceManager;
