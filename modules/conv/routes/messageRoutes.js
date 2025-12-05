import { Router } from "express";
import {
  sendMessage,
  getMessages,
  seenMessages,
} from "../controllers/messageController.js";
import { protect } from "../../identity/controllers/authController.js";
import {
  sendMessageValidator,
  getMessagesValidator,
  markSeenValidator,
} from "../validators/messageValidator.js";

const router = Router();

router.post("/:id", protect, sendMessageValidator, sendMessage);

router.get("/:id", protect, getMessagesValidator, getMessages);

router.put("/seen/:id/", protect, markSeenValidator, seenMessages);

export default router;
