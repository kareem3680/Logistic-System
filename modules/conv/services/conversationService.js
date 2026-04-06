import asyncHandler from "express-async-handler";
import Conversation from "../models/conversationModel.js";
import userModel from "../../identity/models/userModel.js";
import { sanitizeConversation } from "../../../utils/sanitizeData.js";
import { createService } from "../../../utils/servicesHandler.js";
import Logger from "../../../utils/loggerService.js";
import ApiError from "../../../utils/apiError.js";

const logger = new Logger("conversation");

export const createOrGetConversationService = asyncHandler(
  async (currentUser, user2, companyId, role) => {
    // Validate company context
    if (role !== "super-admin" && !companyId) {
      throw new ApiError("🛑 Company context is missing", 403);
    }

    const user1 = currentUser._id;

    if (user1.toString() === user2.toString())
      throw new ApiError("Cannot start conversation with yourself", 400);

    // Check both users exist in the same company
    const usersExist = await userModel.find({
      _id: { $in: [user1, user2] },
      companyId,
    });

    if (usersExist.length !== 2)
      throw new ApiError("One or both users not found in your company", 404);

    // Check if conversation already exists in this company
    let conv = await Conversation.findOne({
      members: { $all: [user1, user2] },
      companyId,
    });

    if (conv) {
      await logger.info("Conversation fetched", {
        conversationId: conv._id,
        companyId,
      });
      return sanitizeConversation(conv);
    }

    conv = await createService(
      Conversation,
      {
        members: [user1, user2],
        companyId,
      },
      companyId,
      role,
    );

    await logger.info("Conversation created", {
      conversationId: conv._id,
      companyId,
    });

    return sanitizeConversation(conv);
  },
);

export const getUserConversationsService = asyncHandler(
  async (currentUser, companyId, role) => {
    // Validate company context
    if (role !== "super-admin" && !companyId) {
      throw new ApiError("🛑 Company context is missing", 403);
    }

    const userId = currentUser._id;

    const convs = await Conversation.find({
      members: userId,
      companyId,
    })
      .sort({ updatedAt: -1 })
      .populate("members", "name role avatar")
      .lean();

    await logger.info("Fetched user conversations", {
      userId,
      companyId,
    });

    return convs.map(sanitizeConversation);
  },
);
