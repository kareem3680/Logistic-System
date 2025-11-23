import { Router } from "express";
const router = Router();

import {
  createJobApplication,
  getAllJobApplications,
  updateJobApplicationStatus,
} from "../controllers/jobApplicationController.js";

import {
  createJobApplicationValidator,
  updateJobApplicationStatusValidator,
} from "../validators/jobApplicationValidator.js";

import {
  protect,
  allowedTo,
} from "../../identity/controllers/authController.js";

router
  .route("/")
  .post(createJobApplicationValidator, createJobApplication)
  .get(protect, allowedTo("admin"), getAllJobApplications);

router
  .route("/status/:id")
  .patch(
    protect,
    allowedTo("admin"),
    updateJobApplicationStatusValidator,
    updateJobApplicationStatus
  );

export default router;
