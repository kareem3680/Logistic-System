import asyncHandler from "express-async-handler";
import {
  createOrGetConversationService,
  getUserConversationsService,
} from "../services/conversationService.js";

export const startConversation = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const conv = await createOrGetConversationService(
    req.user,
    userId,
    req.companyId,
    req.user.role,
  );

  res.status(201).json({
    message: "Conversation started successfully",
    data: conv,
  });
});

export const listConversations = asyncHandler(async (req, res) => {
  const convs = await getUserConversationsService(
    req.user,
    req.companyId,
    req.user.role,
  );

  res.status(200).json({
    message: "Conversations fetched successfully",
    results: convs.length,
    data: convs,
  });
});
