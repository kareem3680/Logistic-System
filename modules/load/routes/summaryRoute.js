import { Router } from "express";
const router = Router();

import {
  getDriverLoadSummary,
  getTruckSummary,
  getAllTrucksSummary,
} from "../controllers/summaryController.js";
import {
  getDriverSummaryValidator,
  getTruckSummaryValidator,
  getAllTrucksSummaryValidator,
} from "../validators/summaryValidator.js";
import {
  protect,
  allowedTo,
} from "../../identity/controllers/authController.js";
import { setCompany } from "../../../middlewares/companyMiddleware.js";

// Protect all routes
router.use(protect);
router.use(setCompany);

router
  .route("/truck")
  .get(allowedTo("admin"), getAllTrucksSummaryValidator, getAllTrucksSummary);

router
  .route("/truck/:id")
  .get(allowedTo("admin"), getTruckSummaryValidator, getTruckSummary);

router
  .route("/driver/:id")
  .get(allowedTo("admin"), getDriverSummaryValidator, getDriverLoadSummary);

export default router;
