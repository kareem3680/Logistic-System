import { Router } from "express";
const router = Router();

import {
  getDrivers,
  createDriver,
  getDriver,
  updateDriver,
  deleteDriver,
} from "../controllers/driverController.js";
import {
  createDriverValidator,
  getDriverValidator,
  updateDriverValidator,
  deleteDriverValidator,
} from "../validators/driverValidator.js";
import {
  protect,
  allowedTo,
} from "../../identity/controllers/authController.js";

router
  .route("/")
  .get(protect, allowedTo("admin", "employee"), getDrivers)
  .post(protect, allowedTo("admin"), createDriverValidator, createDriver);

router
  .route("/:id")
  .get(protect, allowedTo("admin", "employee"), getDriverValidator, getDriver)
  .patch(protect, allowedTo("admin"), updateDriverValidator, updateDriver)
  .delete(protect, allowedTo("admin"), deleteDriverValidator, deleteDriver);

export default router;
