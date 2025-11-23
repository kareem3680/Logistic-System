import { Router } from "express";
const router = Router();

import {
  getSettings,
  createSetting,
  updateSetting,
} from "../controllers/settingController.js";
import {
  createSettingValidator,
  updateSettingValidator,
} from "../validators/settingValidator.js";
import {
  protect,
  allowedTo,
} from "../../identity/controllers/authController.js";

router
  .route("/")
  .get(protect, allowedTo("admin"), getSettings)
  .post(protect, allowedTo("admin"), createSettingValidator, createSetting);

router
  .route("/:id")
  .patch(protect, allowedTo("admin"), updateSettingValidator, updateSetting);

export default router;
