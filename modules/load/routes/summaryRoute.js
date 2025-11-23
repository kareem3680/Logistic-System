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

router
  .route("/truck")
  .get(
    protect,
    allowedTo("admin"),
    getAllTrucksSummaryValidator,
    getAllTrucksSummary
  );

router
  .route("/truck/:id")
  .get(protect, allowedTo("admin"), getTruckSummaryValidator, getTruckSummary);

router
  .route("/driver/:id")
  .get(
    protect,
    allowedTo("admin"),
    getDriverSummaryValidator,
    getDriverLoadSummary
  );

export default router;
