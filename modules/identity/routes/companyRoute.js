import { Router } from "express";
const router = Router();

import {
  protect,
  allowedTo,
} from "../../identity/controllers/authController.js";

import {
  createCompany,
  getCompanies,
  getCompany,
  updateCompany,
  deactivateCompany,
  activateCompany,
} from "../controllers/companyController.js";

import {
  createCompanyValidator,
  updateCompanyValidator,
  getCompanyValidator,
  deactivateCompanyValidator,
  activateCompanyValidator,
} from "../validators/companyValidator.js";

router.use(protect);

router
  .route("/")
  .get(allowedTo("super-admin"), getCompanies)
  .post(allowedTo("super-admin"), createCompanyValidator, createCompany);

router
  .route("/:id")
  .get(allowedTo("super-admin"), getCompanyValidator, getCompany)
  .patch(allowedTo("super-admin"), updateCompanyValidator, updateCompany);

router
  .route("/deactivate/:id")
  .patch(
    allowedTo("super-admin"),
    deactivateCompanyValidator,
    deactivateCompany,
  );

router
  .route("/activate/:id")
  .patch(allowedTo("super-admin"), activateCompanyValidator, activateCompany);

export default router;
