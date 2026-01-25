import { SOCKET_CONFIG } from "../constants.js";
import Logger from "../../utils/loggerService.js";

const logger = new Logger("messageRateLimiter");

class MessageRateLimiter {
  constructor(
    limitMs = SOCKET_CONFIG.MESSAGE_RATE_LIMIT_MS,
    maxMessages = SOCKET_CONFIG.MESSAGE_RATE_MAX_COUNT,
    windowMs = SOCKET_CONFIG.MESSAGE_RATE_WINDOW_MS,
    cleanupIntervalMs = SOCKET_CONFIG.RATE_LIMITER_CLEANUP_MS,
    ttlMs = SOCKET_CONFIG.RATE_LIMITER_TTL_MS
  ) {
    this.limitMs = limitMs;
    this.maxMessages = maxMessages;
    this.windowMs = windowMs;
    this.ttlMs = ttlMs;

    // Per-socket tracking: key = "userId:socketId"
    this.socketTimestamps = new Map();

    // Sliding window tracking: key = "userId:socketId", value = [timestamps]
    this.socketMessages = new Map();

    // Auto-cleanup old entries
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, cleanupIntervalMs);

    console.log("🟢 Rate Limiter initialized with auto-cleanup");
  }

  /**
   * Check if socket can send message
   * @param {string} userId
   * @param {string} socketId
   * @returns {boolean}
   */
  canSendMessage(userId, socketId) {
    const key = `${userId}:${socketId}`;
    const now = Date.now();

    // 1) Simple rate limit check (minimum time between messages)
    const lastTime = this.socketTimestamps.get(key) || 0;
    if (now - lastTime < this.limitMs) {
      return false;
    }

    // 2) Sliding window check (max messages per window)
    if (!this.socketMessages.has(key)) {
      this.socketMessages.set(key, []);
    }

    const messages = this.socketMessages.get(key);

    // Filter messages within the window
    const recentMessages = messages.filter(
      (time) => now - time < this.windowMs
    );

    if (recentMessages.length >= this.maxMessages) {
      return false;
    }

    // Update tracking
    recentMessages.push(now);
    this.socketMessages.set(key, recentMessages);
    this.socketTimestamps.set(key, now);

    return true;
  }

  /**
   * Clear rate limit data for a specific socket
   * @param {string} userId
   * @param {string} socketId
   */
  clearSocket(userId, socketId) {
    const key = `${userId}:${socketId}`;
    this.socketTimestamps.delete(key);
    this.socketMessages.delete(key);
  }

  /**
   * Clear all rate limit data for a user (all sockets)
   * @param {string} userId
   */
  clearUser(userId) {
    const keysToDelete = [];

    for (const key of this.socketTimestamps.keys()) {
      if (key.startsWith(`${userId}:`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => {
      this.socketTimestamps.delete(key);
      this.socketMessages.delete(key);
    });

    if (keysToDelete.length > 0) {
      logger.info(
        `Rate Limiter: Cleared ${keysToDelete.length} entries for user ${userId}`
      );
    }
  }

  /**
   * Auto-cleanup old entries
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, timestamp] of this.socketTimestamps.entries()) {
      if (now - timestamp > this.ttlMs) {
        this.socketTimestamps.delete(key);
        this.socketMessages.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info(`Rate Limiter: Cleaned ${cleaned} old entries`);
    }
  }

  /**
   * Get statistics
   * @returns {Object}
   */
  getStats() {
    return {
      totalTrackedSockets: this.socketTimestamps.size,
      totalMessageHistories: this.socketMessages.size,
    };
  }

  /**
   * Destroy rate limiter (clear interval)
   */
  destroy() {
    clearInterval(this.cleanupInterval);
    this.socketTimestamps.clear();
    this.socketMessages.clear();
    logger.info("Rate Limiter destroyed");
  }
}

// Singleton instance
const rateLimiter = new MessageRateLimiter();

export default rateLimiter;
