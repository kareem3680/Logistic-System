import asyncHandler from "express-async-handler";
import Message from "../models/messageModel.js";
import Conversation from "../models/conversationModel.js";
import { sanitizeMessage } from "../../../utils/sanitizeData.js";
import { createService } from "../../../utils/servicesHandler.js";
import Logger from "../../../utils/loggerService.js";
import ApiError from "../../../utils/apiError.js";

const logger = new Logger("message");

export const addMessageService = asyncHandler(
  async ({ conversationId, sender, text }) => {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) throw new ApiError("Conversation not found", 404);

    if (!conversation.members.includes(sender))
      throw new ApiError("You are not a member of this conversation", 403);

    const message = await createService(Message, {
      conversationId,
      sender,
      text,
    });

    conversation.lastMessage = { text, sender, createdAt: new Date() };
    await conversation.save();

    await logger.info("Message added", {
      messageId: message._id,
      conversationId,
    });

    return sanitizeMessage(message);
  }
);

export const getConversationMessagesService = asyncHandler(
  async (conversationId, currentUserId) => {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) throw new ApiError("Conversation not found", 404);

    if (!conversation.members.includes(currentUserId))
      throw new ApiError("You are not a member of this conversation", 403);

    const messages = await Message.find({ conversationId }).sort({
      createdAt: 1,
    });

    await logger.info("Fetched conversation messages", { conversationId });

    return messages.map(sanitizeMessage);
  }
);

export const markMessagesSeenService = asyncHandler(
  async (conversationId, userId) => {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) throw new ApiError("Conversation not found", 404);

    if (!conversation.members.includes(userId))
      throw new ApiError("You are not a member of this conversation", 403);

    await Message.updateMany(
      {
        conversationId,
        sender: { $ne: userId },
        seen: false,
      },
      { seen: true }
    );

    await logger.info("Messages marked as seen", { conversationId, userId });

    return { success: true };
  }
);
