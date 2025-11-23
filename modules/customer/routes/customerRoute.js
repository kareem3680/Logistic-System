import { Router } from "express";
const router = Router();

import {
  getCustomers,
  createCustomer,
  getCustomer,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customerController.js";
import {
  createCustomerValidator,
  getCustomerValidator,
  updateCustomerValidator,
  deleteCustomerValidator,
} from "../validators/customerValidator.js";
import {
  protect,
  allowedTo,
} from "../../identity/controllers/authController.js";

router
  .route("/")
  .get(protect, allowedTo("admin", "employee"), getCustomers)
  .post(
    protect,
    allowedTo("admin", "employee"),
    createCustomerValidator,
    createCustomer
  );

router
  .route("/:id")
  .get(
    protect,
    allowedTo("admin", "employee"),
    getCustomerValidator,
    getCustomer
  )
  .patch(
    protect,
    allowedTo("admin", "employee"),
    updateCustomerValidator,
    updateCustomer
  )
  .delete(
    protect,
    allowedTo("admin", "employee"),
    deleteCustomerValidator,
    deleteCustomer
  );

export default router;
