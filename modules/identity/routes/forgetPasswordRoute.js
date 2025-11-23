import { Router } from "express";
const router = Router();

import {
  sendResetCode,
  verifyResetCode,
  resetPassword,
  resendResetCode,
} from "../controllers/forgetPasswordController.js";

import {
  sendResetCodeValidator,
  verifyResetCodeValidator,
  resetPasswordValidator,
  resendResetCodeValidator,
} from "../validators/forgetPasswordValidator.js";

router.post("/sendResetCode", sendResetCodeValidator, sendResetCode);
router.post("/resendResetCode", resendResetCodeValidator, resendResetCode);
router.post("/verifyResetCode", verifyResetCodeValidator, verifyResetCode);
router.put("/resetPassword", resetPasswordValidator, resetPassword);

export default router;
