import { ROOM_PREFIXES } from "../constants.js";

/**
 * Generate conversation room name
 * @param {string} conversationId
 * @returns {string}
 */
export function getConversationRoom(conversationId) {
  return `${ROOM_PREFIXES.CONVERSATION}${conversationId}`;
}

/**
 * Generate user-specific room name
 * @param {string} userId
 * @returns {string}
 */
export function getUserRoom(userId) {
  return `${ROOM_PREFIXES.USER}${userId}`;
}

/**
 * Generate role-specific room name (scoped by company)
 * @param {string} role
 * @param {string} companyId - Company ID for isolation
 * @returns {string}
 */
export function getRoleRoom(role, companyId) {
  return `${ROOM_PREFIXES.ROLE}${role}_${companyId}`;
}

/**
 * Join user to their personal and role rooms
 * @param {Socket} socket
 */
export function joinUserRooms(socket) {
  const userId = socket.user?._id?.toString();
  const userRole = socket.user?.role;
  const companyId = socket.user?.companyId;

  if (userId) {
    const userRoom = getUserRoom(userId);
    socket.join(userRoom);
    console.log(`🔵 User ${userId} joined room: ${userRoom}`);
  }

  if (userRole && companyId) {
    const roleRoom = getRoleRoom(userRole, companyId);
    socket.join(roleRoom);
    console.log(
      `🔵 User ${userId} joined role room: ${roleRoom} (Company: ${companyId})`,
    );
  }
}

/**
 * Leave all conversation rooms
 * @param {Socket} socket
 */
export function leaveAllConversationRooms(socket) {
  const currentRooms = Array.from(socket.rooms);
  const conversationRooms = currentRooms.filter((room) =>
    room.startsWith(ROOM_PREFIXES.CONVERSATION),
  );

  conversationRooms.forEach((room) => {
    socket.leave(room);
    console.log(`📤 Socket ${socket.id} left room: ${room}`);
  });

  return conversationRooms.length;
}

/**
 * Check if socket is in a specific conversation room
 * @param {Socket} socket
 * @param {string} conversationId
 * @returns {boolean}
 */
export function isInConversationRoom(socket, conversationId) {
  const roomName = getConversationRoom(conversationId);
  return socket.rooms.has(roomName);
}

/**
 * Get all rooms a socket is in (for debugging)
 * @param {Socket} socket
 * @returns {string[]}
 */
export function getSocketRooms(socket) {
  return Array.from(socket.rooms);
}
