import { Router } from "express";
import {
  startConversation,
  listConversations,
} from "../controllers/conversationController.js";
import { protect } from "../../identity/controllers/authController.js";
import { setCompany } from "../../../middlewares/companyMiddleware.js";
import { startConversationValidator } from "../validators/conversationValidator.js";

const router = Router();

router.use(protect);
router.use(setCompany);

router.post("/start", startConversationValidator, startConversation);
router.get("/", listConversations);

export default router;
