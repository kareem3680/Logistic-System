import { Router } from "express";
const router = Router();

import { updateMyPassword } from "../controllers/updatePasswordController.js";
import { updatePasswordValidator as _updatePasswordValidator } from "../validators/updatePasswordValidator.js";
import { protect } from "../controllers/authController.js";

router.patch("/", protect, _updatePasswordValidator, updateMyPassword);

export default router;
