import { Router } from "express";
const router = Router();

import {
  createTimeOff,
  getAllTimeOff,
  getMyTimeOff,
  cancelTimeOff,
  updateTimeOffStatus,
} from "../controllers/timeOffController.js";

import {
  createTimeOffValidator,
  getAllTimeOffValidator,
  updateTimeOffStatusValidator,
  cancelTimeOffValidator,
} from "../validators/timeOffValidator.js";

import {
  protect,
  allowedTo,
} from "../../identity/controllers/authController.js";
import { setCompany } from "../../../middlewares/companyMiddleware.js";

// Protect all routes
router.use(protect);
router.use(setCompany);

// Driver submits time off request
router.post("/", allowedTo("driver"), createTimeOffValidator, createTimeOff);

// Driver views own time off requests
router.get("/my", allowedTo("driver"), getAllTimeOffValidator, getMyTimeOff);

// Driver cancel own time off requests
router.patch(
  "/cancel/:id",
  allowedTo("driver"),
  cancelTimeOffValidator,
  cancelTimeOff,
);

// Admin views all time off requests
router.get("/all", allowedTo("admin"), getAllTimeOffValidator, getAllTimeOff);

// Admin approves/rejects a request
router.patch(
  "/status/:id",
  allowedTo("admin"),
  updateTimeOffStatusValidator,
  updateTimeOffStatus,
);

export default router;
