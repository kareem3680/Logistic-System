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

// Driver submits time off request
router.post(
  "/",
  protect,
  allowedTo("driver"),
  createTimeOffValidator,
  createTimeOff
);

// Driver views own time off requests
router.get(
  "/my",
  protect,
  allowedTo("driver"),
  getAllTimeOffValidator,
  getMyTimeOff
);

// Driver cancel own time off requests
router.patch(
  "/cancel/:id",
  protect,
  allowedTo("driver"),
  cancelTimeOffValidator,
  cancelTimeOff
);
// Admin views all time off requests
router.get(
  "/all",
  protect,
  allowedTo("admin"),
  getAllTimeOffValidator,
  getAllTimeOff
);

// Admin approves/rejects a request
router.patch(
  "/status/:id",
  protect,
  allowedTo("admin"),
  updateTimeOffStatusValidator,
  updateTimeOffStatus
);

export default router;
