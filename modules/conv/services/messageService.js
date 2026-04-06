import asyncHandler from "express-async-handler";
import Message from "../models/messageModel.js";
import Conversation from "../models/conversationModel.js";
import { sanitizeMessage } from "../../../utils/sanitizeData.js";
import Logger from "../../../utils/loggerService.js";
import ApiError from "../../../utils/apiError.js";

const logger = new Logger("message");

/**
 * Add message with sequence number (atomic)
 */
export const addMessageService = asyncHandler(
  async ({ conversationId, sender, text, companyId, role }) => {
    // Validate company context
    if (role !== "super-admin" && !companyId) {
      throw new ApiError("🛑 Company context is missing", 403);
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      companyId,
    });
    if (!conversation)
      throw new ApiError("Conversation not found in your company", 404);

    if (!conversation.members.includes(sender))
      throw new ApiError("You are not a member of this conversation", 403);

    // Atomically increment sequence number
    const updatedConversation = await Conversation.findByIdAndUpdate(
      conversationId,
      {
        $inc: { messageSequence: 1 },
        lastMessage: { text, sender, createdAt: new Date() },
      },
      { new: true, select: "messageSequence" },
    );

    // Create message with sequence number and companyId
    const message = await Message.create({
      conversationId,
      sender,
      text,
      sequenceNumber: updatedConversation.messageSequence,
      companyId,
    });

    await logger.info("Message added", {
      messageId: message._id,
      conversationId,
      sequenceNumber: message.sequenceNumber,
      companyId,
    });

    return sanitizeMessage(message);
  },
);

/**
 * Get conversation messages
 */
export const getConversationMessagesService = asyncHandler(
  async (conversationId, currentUserId, companyId, role) => {
    // Validate company context
    if (role !== "super-admin" && !companyId) {
      throw new ApiError("🛑 Company context is missing", 403);
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      companyId,
    });
    if (!conversation)
      throw new ApiError("Conversation not found in your company", 404);

    if (!conversation.members.includes(currentUserId))
      throw new ApiError("You are not a member of this conversation", 403);

    const messages = await Message.find({
      conversationId,
      companyId,
    })
      .sort({ sequenceNumber: 1 })
      .lean();

    await logger.info("Fetched conversation messages", {
      conversationId,
      companyId,
    });

    return messages.map(sanitizeMessage);
  },
);

/**
 * Mark messages as seen (with optional messageId)
 * @param {string} conversationId
 * @param {string} userId
 * @param {string} messageId - Optional: mark up to this message
 */
export const markMessagesSeenService = asyncHandler(
  async (conversationId, userId, messageId = null, companyId, role) => {
    // Validate company context
    if (role !== "super-admin" && !companyId) {
      throw new ApiError("🛑 Company context is missing", 403);
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      companyId,
    });
    if (!conversation)
      throw new ApiError("Conversation not found in your company", 404);

    if (!conversation.members.includes(userId))
      throw new ApiError("You are not a member of this conversation", 403);

    let query = {
      conversationId,
      companyId,
      sender: { $ne: userId },
      seen: false,
    };

    // If messageId provided, mark messages up to that sequence number
    if (messageId) {
      const targetMessage = await Message.findOne({
        _id: messageId,
        companyId,
      }).select("sequenceNumber");
      if (targetMessage) {
        query.sequenceNumber = { $lte: targetMessage.sequenceNumber };
      }
    }

    const result = await Message.updateMany(query, { seen: true });

    await logger.info("Messages marked as seen", {
      conversationId,
      userId,
      messageId,
      count: result.modifiedCount,
      companyId,
    });

    return {
      success: true,
      modifiedCount: result.modifiedCount,
    };
  },
);
