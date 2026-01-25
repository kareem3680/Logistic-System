export const SOCKET_CONFIG = {
  // Rate limiting
  MESSAGE_RATE_LIMIT_MS: 400, // Minimum time between messages
  MESSAGE_RATE_WINDOW_MS: 60000, // 1 minute
  MESSAGE_RATE_MAX_COUNT: 10, // Max 10 messages per minute

  // Typing indicators
  TYPING_TIMEOUT_MS: 5000, // Auto-stop typing after 5s

  // Cleanup intervals
  RATE_LIMITER_CLEANUP_MS: 300000, // Clean every 5 minutes
  RATE_LIMITER_TTL_MS: 600000, // Remove entries after 10 minutes

  // Presence
  PRESENCE_BATCH_SIZE: 100, // Max users in presence list

  // Socket.io options
  PING_TIMEOUT: 60000,
  PING_INTERVAL: 25000,
  MAX_DISCONNECTION_DURATION: 120000, // 2 minutes
};

export const ROOM_PREFIXES = {
  CONVERSATION: "conversation_",
  USER: "user_",
  ROLE: "role_",
};

export const SOCKET_EVENTS = {
  // Connection
  CONNECT: "connect",
  DISCONNECT: "disconnect",

  // Conversations
  JOIN_CONVERSATION: "joinConversation",
  LEAVE_CONVERSATION: "leaveConversation",
  CONVERSATION_JOINED: "conversationJoined",
  CONVERSATION_LEFT: "conversationLeft",

  // Messages
  SEND_MESSAGE: "sendMessage",
  NEW_MESSAGE: "newMessage",

  // Typing
  TYPING: "typing",
  STOP_TYPING: "stopTyping",

  // Seen status
  MARK_SEEN: "markSeen",
  SEEN_UPDATE: "seenUpdate",
  SEEN_ACKNOWLEDGED: "seenAcknowledged",

  // Presence
  USER_ONLINE: "userOnline",
  USER_OFFLINE: "userOffline",
  PRESENCE_LIST: "presenceList",

  // Errors
  SOCKET_ERROR: "socketError",

  // Testing
  PING: "ping",
  PONG: "pong",
};

export const ERROR_MESSAGES = {
  AUTH_REQUIRED: "Authentication required",
  AUTH_FAILED: "Authentication failed",
  INVALID_CONVERSATION_ID: "Invalid conversation ID",
  INVALID_MESSAGE_ID: "Invalid message ID",
  CONVERSATION_NOT_FOUND: "Conversation not found",
  ACCESS_DENIED: "Access denied",
  MESSAGE_REQUIRED: "Message text is required",
  RATE_LIMIT_EXCEEDED: "Too many messages, please slow down",
  FAILED_TO_SEND: "Failed to send message",
  FAILED_TO_MARK_SEEN: "Failed to mark messages as seen",
  INTERNAL_ERROR: "Internal server error",
  DATABASE_UNAVAILABLE: "Database temporarily unavailable",
};

export const HTTP_STATUS = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};
