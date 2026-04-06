import { Router } from "express";
const router = Router();

import {
  protect,
  allowedTo,
} from "../../identity/controllers/authController.js";
import { setCompany } from "../../../middlewares/companyMiddleware.js";

import {
  createServiceCenter,
  getServiceCenters,
  getServiceCenter,
  updateServiceCenter,
  deleteServiceCenter,
  getServiceCentersStats,
} from "../controllers/serviceCenterController.js";

import {
  createServiceCenterValidator,
  updateServiceCenterValidator,
  getServiceCenterValidator,
  deleteServiceCenterValidator,
} from "../validators/serviceCenterValidator.js";

router.use(protect);
router.use(setCompany);

router
  .route("/")
  .get(getServiceCenters)
  .post(
    allowedTo("admin", "employee"),
    createServiceCenterValidator,
    createServiceCenter,
  );

router.get("/stats", allowedTo("admin"), getServiceCentersStats);

router
  .route("/:id")
  .get(getServiceCenterValidator, getServiceCenter)
  .patch(
    allowedTo("admin", "employee"),
    updateServiceCenterValidator,
    updateServiceCenter,
  )
  .delete(
    allowedTo("admin"),
    deleteServiceCenterValidator,
    deleteServiceCenter,
  );

export default router;
