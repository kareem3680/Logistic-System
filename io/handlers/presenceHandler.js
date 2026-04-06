import { SOCKET_EVENTS } from "../constants.js";
import presenceManager from "../managers/presenceManager.js";
import { getUserPresenceService } from "../../modules/conv/services/presenceService.js";
import Logger from "../../utils/loggerService.js";
import Conversation from "../../modules/conv/models/conversationModel.js";

const logger = new Logger("socketPresence");

/**
 * Send scoped presence list to newly connected user
 * Only sends presence for users in their conversations (not all users)
 * @param {Socket} socket
 * @param {string} userId
 */
export async function sendPresenceList(socket, userId) {
  try {
    const companyId = socket.user?.companyId;

    // Get user's conversations (only in their company)
    const userConversations = await Conversation.find({
      members: userId,
      companyId,
    })
      .select("members")
      .lean();

    // Extract unique member IDs
    const relevantUserIds = new Set();
    userConversations.forEach((conv) => {
      conv.members.forEach((memberId) => {
        const memberIdStr = memberId.toString();
        if (memberIdStr !== userId) {
          relevantUserIds.add(memberIdStr);
        }
      });
    });

    // Get presence only for relevant users in the same company
    const presenceList = await Promise.all(
      Array.from(relevantUserIds).map(async (id) => {
        try {
          const presence = await getUserPresenceService(id, companyId);
          const sockets = presenceManager.getUserSockets(id);
          let hasActiveSocket = false;

          for (const socketId of sockets) {
            if (socket.nsp.sockets.has(socketId)) {
              hasActiveSocket = true;
              break;
            } else {
              presenceManager.removeConnection(id, socketId);
            }
          }

          const isOnline = hasActiveSocket || presence?.online === true;

          return {
            userId: id,
            isOnline,
            lastSeen: presence?.lastSeen || null,
          };
        } catch (error) {
          logger.error(`Failed to get presence for user ${id}:`, error);
          return {
            userId: id,
            isOnline: false,
            lastSeen: null,
          };
        }
      }),
    );

    socket.emit(SOCKET_EVENTS.PRESENCE_LIST, presenceList);

    logger.info(
      `Sent presence list with ${presenceList.length} users to ${userId} in company ${companyId}`,
    );
  } catch (error) {
    logger.error("Failed to send presence list:", error);
  }
}
