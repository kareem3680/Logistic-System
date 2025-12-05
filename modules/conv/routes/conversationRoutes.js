import { Router } from "express";
import {
  startConversation,
  listConversations,
} from "../controllers/conversationController.js";
import { protect } from "../../identity/controllers/authController.js";
import { startConversationValidator } from "../validators/conversationValidator.js";

const router = Router();

router.post("/start", protect, startConversationValidator, startConversation);

router.get("/", protect, listConversations);

export default router;
