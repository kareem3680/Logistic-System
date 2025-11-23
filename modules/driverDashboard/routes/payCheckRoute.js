import { Router } from "express";
const router = Router();

import { getDriverPaycheck } from "../controllers/payCheckController.js";
import {
  protect,
  allowedTo,
} from "../../identity/controllers/authController.js";

router.route("/").get(protect, allowedTo("driver"), getDriverPaycheck);

export default router;
