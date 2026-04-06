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

import { setCompany } from "../../../middlewares/companyMiddleware.js";

router
  .route("/")
  .get(protect, setCompany, allowedTo("admin", "employee"), getCustomers)
  .post(
    protect,
    setCompany,
    allowedTo("admin", "employee"),
    createCustomerValidator,
    createCustomer,
  );

router
  .route("/:id")
  .get(
    protect,
    setCompany,
    allowedTo("admin", "employee"),
    getCustomerValidator,
    getCustomer,
  )
  .patch(
    protect,
    setCompany,
    allowedTo("admin", "employee"),
    updateCustomerValidator,
    updateCustomer,
  )
  .delete(
    protect,
    setCompany,
    allowedTo("admin", "employee"),
    deleteCustomerValidator,
    deleteCustomer,
  );

export default router;
