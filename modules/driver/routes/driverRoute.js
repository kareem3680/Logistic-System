import { Router } from "express";
const router = Router();

import { uploadPDFs } from "../../../middlewares/uploadMiddleware.js";

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

import { setCompany } from "../../../middlewares/companyMiddleware.js";

// Apply protect + setCompany before any company-sensitive routes
router
  .route("/")
  .get(protect, setCompany, allowedTo("admin", "employee"), getDrivers)
  .post(
    protect,
    setCompany,
    allowedTo("admin"),
    createDriverValidator,
    createDriver,
  );

router
  .route("/:id")
  .get(
    protect,
    setCompany,
    allowedTo("admin", "employee"),
    getDriverValidator,
    getDriver,
  )
  .patch(
    protect,
    setCompany,
    allowedTo("admin"),
    uploadPDFs,
    updateDriverValidator,
    updateDriver,
  )
  .delete(
    protect,
    setCompany,
    allowedTo("admin"),
    deleteDriverValidator,
    deleteDriver,
  );

export default router;
