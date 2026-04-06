import asyncHandler from "express-async-handler";
import {
  addMessageService,
  getConversationMessagesService,
  markMessagesSeenService,
} from "../services/messageService.js";

export const sendMessage = asyncHandler(async (req, res) => {
  const message = await addMessageService({
    conversationId: req.params.id,
    sender: req.user._id,
    text: req.body.text,
    companyId: req.companyId,
    role: req.user.role,
  });

  res.status(201).json({
    message: "Message sent successfully",
    data: message,
  });
});

export const getMessages = asyncHandler(async (req, res) => {
  const msgs = await getConversationMessagesService(
    req.params.id,
    req.user._id,
    req.companyId,
    req.user.role,
  );

  res.status(200).json({
    message: "Messages fetched successfully",
    results: msgs.length,
    data: msgs,
  });
});

export const seenMessages = asyncHandler(async (req, res) => {
  const messageId = req.body?.messageId;

  await markMessagesSeenService(
    req.params.id,
    req.user._id,
    messageId,
    req.companyId,
    req.user.role,
  );

  res.status(200).json({
    message: "Messages marked as seen successfully",
  });
});
