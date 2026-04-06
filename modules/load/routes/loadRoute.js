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
import { setCompany } from "../../../middlewares/companyMiddleware.js";
import { uploadPDFs } from "../../../middlewares/uploadMiddleware.js";

// Protect all routes
router.use(protect);
router.use(setCompany);

router
  .route("/")
  .get(allowedTo("admin", "employee"), getAllLoads)
  .post(
    allowedTo("admin", "employee"),
    uploadPDFs,
    createLoadValidator,
    createLoad,
  );

router
  .route("/status/:id")
  .patch(
    allowedTo("admin", "employee"),
    updateLoadStatusValidator,
    updateLoadStatus,
  );

router
  .route("/update/:id")
  .patch(
    allowedTo("admin", "employee"),
    uploadPDFs,
    updateLoadValidator,
    updateLoadController,
  );

export default router;
