import { SOCKET_EVENTS, HTTP_STATUS } from "../constants.js";

/**
 * Emit safe error to socket client
 * Prevents exposure of sensitive server details
 * @param {Socket} socket - Socket instance
 * @param {Object} error - Error object
 * @param {string} error.message - Error message (user-facing)
 * @param {number} error.code - HTTP status code
 */
export function emitSocketError(socket, error) {
  const safeMessage = sanitizeErrorMessage(error.message);

  socket.emit(SOCKET_EVENTS.SOCKET_ERROR, {
    message: safeMessage,
    statusCode: error.code || HTTP_STATUS.INTERNAL_ERROR,
    timestamp: new Date().toISOString(),
  });

  // Log detailed error server-side (without exposing to client)
  if (error.details) {
    console.error("Socket error details:", error.details);
  }
}

/**
 * Sanitize error message to prevent info leakage
 * @param {string} message - Original error message
 * @returns {string}
 */
function sanitizeErrorMessage(message) {
  if (!message || typeof message !== "string") {
    return "An error occurred";
  }

  // Remove potential stack traces or file paths
  const cleaned = message
    .split("\n")[0] // Take only first line
    .replace(/at .+:\d+:\d+/g, "") // Remove stack trace hints
    .replace(/\/[\w\/\.-]+/g, "") // Remove file paths
    .trim();

  return cleaned || "An error occurred";
}

/**
 * Create error object with consistent structure
 * @param {string} message - User-facing message
 * @param {number} code - HTTP status code
 * @param {any} details - Internal details (not sent to client)
 * @returns {Object}
 */
export function createSocketError(message, code, details = null) {
  return {
    message,
    code,
    details,
  };
}
