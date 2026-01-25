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
 * Generate role-specific room name
 * @param {string} role
 * @returns {string}
 */
export function getRoleRoom(role) {
  return `${ROOM_PREFIXES.ROLE}${role}`;
}

/**
 * Join user to their personal and role rooms
 * @param {Socket} socket
 */
export function joinUserRooms(socket) {
  const userId = socket.user?._id?.toString();
  const userRole = socket.user?.role;

  if (userId) {
    const userRoom = getUserRoom(userId);
    socket.join(userRoom);
    console.log(`🔵 User ${userId} joined room: ${userRoom}`);
  }

  if (userRole) {
    const roleRoom = getRoleRoom(userRole);
    socket.join(roleRoom);
    console.log(`🔵 User ${userId} joined role room: ${roleRoom}`);
  }
}

/**
 * Leave all conversation rooms
 * @param {Socket} socket
 */
export function leaveAllConversationRooms(socket) {
  const currentRooms = Array.from(socket.rooms);
  const conversationRooms = currentRooms.filter((room) =>
    room.startsWith(ROOM_PREFIXES.CONVERSATION)
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
