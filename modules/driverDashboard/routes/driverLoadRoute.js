import { Router } from "express";
const router = Router();

import { uploadPDFs } from "../../../middlewares/uploadMiddleware.js";
import { setCompany } from "../../../middlewares/companyMiddleware.js";
import {
  addDriverDocumentsValidator,
  updateLoadAppointmentValidator,
} from "../validators/driverLoadValidator.js";
import {
  getAllLoads,
  addDriverDocuments,
  updateLoadAppointment,
} from "../controllers/driverLoadController.js";

import {
  protect,
  allowedTo,
} from "../../identity/controllers/authController.js";

// Protect all routes
router.use(protect);
router.use(setCompany);

router.route("/").get(allowedTo("driver"), getAllLoads);

router.post(
  "/add-documents/:id",
  allowedTo("driver"),
  uploadPDFs,
  addDriverDocumentsValidator,
  addDriverDocuments,
);

router
  .route("/update-appointment/:id")
  .patch(
    allowedTo("driver"),
    updateLoadAppointmentValidator,
    updateLoadAppointment,
  );

export default router;
