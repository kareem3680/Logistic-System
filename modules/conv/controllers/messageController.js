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
  });
  res.status(201).json({
    message: "Message sent successfully",
    data: message,
  });
});

export const getMessages = asyncHandler(async (req, res) => {
  const msgs = await getConversationMessagesService(
    req.params.id,
    req.user._id
  );
  res.status(200).json({
    message: "Messages fetched successfully",
    results: msgs.length,
    data: msgs,
  });
});

export const seenMessages = asyncHandler(async (req, res) => {
  await markMessagesSeenService(req.params.id, req.user._id);
  res.status(200).json({
    message: "Messages marked as seen successfully",
  });
});
