import { Router } from "express";
const router = Router();

import {
  getTrucks,
  createTruck,
  getTruck,
  updateTruck,
  deleteTruck,
} from "../../truck/controllers/truckController.js";
import {
  createTruckValidator,
  getTruckValidator,
  updateTruckValidator,
  deleteTruckValidator,
} from "../../truck/validators/truckValidator.js";
import {
  protect,
  allowedTo,
} from "../../identity/controllers/authController.js";

router
  .route("/")
  .get(protect, allowedTo("admin", "employee"), getTrucks)
  .post(protect, allowedTo("admin"), createTruckValidator, createTruck);

router
  .route("/:id")
  .get(protect, allowedTo("admin", "employee"), getTruckValidator, getTruck)
  .patch(protect, allowedTo("admin"), updateTruckValidator, updateTruck)
  .delete(protect, allowedTo("admin"), deleteTruckValidator, deleteTruck);

export default router;
