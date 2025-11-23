import { Router } from "express";
const router = Router();

import {
  getAllLoads,
  createLoad,
  updateLoadStatus,
  updateLoadController,
} from "../controllers/loadController.js";
import {
  createLoadValidator,
  updateLoadStatusValidator,
  updateLoadValidator,
} from "../validators/loadValidator.js";
import {
  protect,
  allowedTo,
} from "../../identity/controllers/authController.js";
import { uploadPDFs } from "../../../middlewares/uploadMiddleware.js";

router
  .route("/")
  .get(protect, allowedTo("admin", "employee"), getAllLoads)
  .post(
    protect,
    allowedTo("admin", "employee"),
    uploadPDFs,
    createLoadValidator,
    createLoad
  );

router
  .route("/status/:id")
  .patch(
    protect,
    allowedTo("admin", "employee"),
    updateLoadStatusValidator,
    updateLoadStatus
  );

router
  .route("/update/:id")
  .patch(
    protect,
    allowedTo("admin", "employee"),
    uploadPDFs,
    updateLoadValidator,
    updateLoadController
  );

export default router;
