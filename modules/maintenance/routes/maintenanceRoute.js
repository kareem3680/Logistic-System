import { Router } from "express";
const router = Router();

import {
  protect,
  allowedTo,
} from "../../identity/controllers/authController.js";
import { setCompany } from "../../../middlewares/companyMiddleware.js";

import {
  createMaintenance,
  getMaintenances,
  getMaintenance,
  updateMaintenance,
  deleteMaintenance,
} from "../controllers/maintenanceController.js";

import {
  createMaintenanceValidator,
  updateMaintenanceValidator,
  getMaintenanceValidator,
  deleteMaintenanceValidator,
} from "../validators/maintenanceValidator.js";

router.use(protect);
router.use(setCompany);

router
  .route("/")
  .get(allowedTo("admin"), getMaintenances)
  .post(allowedTo("admin"), createMaintenanceValidator, createMaintenance);

router
  .route("/:id")
  .get(allowedTo("admin"), getMaintenanceValidator, getMaintenance)
  .patch(allowedTo("admin"), updateMaintenanceValidator, updateMaintenance)
  .delete(allowedTo("admin"), deleteMaintenanceValidator, deleteMaintenance);

export default router;
