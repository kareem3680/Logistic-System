import { Router } from "express";
import { saveFcmToken } from "../controllers/saveFcmTokenController.js";
import { saveFcmTokenValidator } from "../validators/saveFcmTokenValidator.js";
import { protect } from "../../identity/controllers/authController.js";

const router = Router();

router.post("/", protect, saveFcmTokenValidator, saveFcmToken);

export default router;
