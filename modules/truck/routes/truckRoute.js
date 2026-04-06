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

import { setCompany } from "../../../middlewares/companyMiddleware.js";

router
  .route("/")
  .get(protect, setCompany, allowedTo("admin", "employee"), getTrucks)
  .post(
    protect,
    setCompany,
    allowedTo("admin"),
    createTruckValidator,
    createTruck,
  );

router
  .route("/:id")
  .get(
    protect,
    setCompany,
    allowedTo("admin", "employee"),
    getTruckValidator,
    getTruck,
  )
  .patch(
    protect,
    setCompany,
    allowedTo("admin"),
    updateTruckValidator,
    updateTruck,
  )
  .delete(
    protect,
    setCompany,
    allowedTo("admin"),
    deleteTruckValidator,
    deleteTruck,
  );

export default router;
