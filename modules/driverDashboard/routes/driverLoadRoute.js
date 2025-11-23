import { Router } from "express";
const router = Router();

import { uploadPDFs } from "../../../middlewares/uploadMiddleware.js";
import { addDriverDocumentsValidator } from "../validators/driverLoadValidator.js";
import {
  getAllLoads,
  addDriverDocuments,
} from "../controllers/driverLoadController.js";

import {
  protect,
  allowedTo,
} from "../../identity/controllers/authController.js";

router.route("/").get(protect, allowedTo("driver"), getAllLoads);

router.post(
  "/add-documents/:id",
  protect,
  allowedTo("driver"),
  uploadPDFs,
  addDriverDocumentsValidator,
  addDriverDocuments
);

export default router;
