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
import { setCompany } from "../../../middlewares/companyMiddleware.js";

router.use(protect);
router.use(setCompany);

router
  .route("/")
  .get(allowedTo("admin"), getSettings)
  .post(allowedTo("admin"), createSettingValidator, createSetting);

router
  .route("/:id")
  .patch(allowedTo("admin"), updateSettingValidator, updateSetting);

export default router;
