import { Router } from "express";
import {
  sendMessage,
  getMessages,
  seenMessages,
} from "../controllers/messageController.js";
import { protect } from "../../identity/controllers/authController.js";
import { setCompany } from "../../../middlewares/companyMiddleware.js";
import {
  sendMessageValidator,
  getMessagesValidator,
  markSeenValidator,
} from "../validators/messageValidator.js";

const router = Router();

router.use(protect);
router.use(setCompany);

router.post("/:id", sendMessageValidator, sendMessage);
router.get("/:id", getMessagesValidator, getMessages);
router.put("/seen/:id/", markSeenValidator, seenMessages);

export default router;
