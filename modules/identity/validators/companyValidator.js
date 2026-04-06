import { body, param, check } from "express-validator";
import validationMiddleware from "../../../middlewares/validatorMiddleware.js";
import Company from "../models/companyModel.js";

// -----------------------------
// Create Company Validator
// -----------------------------
export const createCompanyValidator = [
  body("name")
    .exists({ checkFalsy: true })
    .withMessage("Company name is required")
    .bail()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Company name must be between 2 and 100 characters")
    .bail()
    .custom(async (name) => {
      const existingCompany = await Company.findOne({ name });
      if (existingCompany) {
        throw new Error("Company name already exists");
      }
      return true;
    }),

  body("email")
    .exists({ checkFalsy: true })
    .withMessage("Email is required")
    .bail()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .bail()
    .normalizeEmail()
    .custom(async (email) => {
      const existingCompany = await Company.findOne({ email });
      if (existingCompany) {
        throw new Error("Email already exists");
      }
      return true;
    }),

  check("phone").optional(),

  validationMiddleware,
];

// -----------------------------
// Update Company Validator
// -----------------------------
export const updateCompanyValidator = [
  param("id").isMongoId().withMessage("Invalid company ID"),

  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Company name cannot be empty")
    .bail()
    .isLength({ min: 2, max: 100 })
    .withMessage("Company name must be between 2 and 100 characters")
    .bail()
    .custom(async (name, { req }) => {
      const existingCompany = await Company.findOne({
        name,
        _id: { $ne: req.params.id },
      });
      if (existingCompany) {
        throw new Error("Company name already exists");
      }
      return true;
    }),

  body("email")
    .optional()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .bail()
    .normalizeEmail()
    .custom(async (email, { req }) => {
      const existingCompany = await Company.findOne({
        email,
        _id: { $ne: req.params.id },
      });
      if (existingCompany) {
        throw new Error("Email already exists");
      }
      return true;
    }),

  check("phone").optional(),

  validationMiddleware,
];

// -----------------------------
// Get Single Company Validator
// -----------------------------
export const getCompanyValidator = [
  param("id").isMongoId().withMessage("Invalid company ID"),
  validationMiddleware,
];

// -----------------------------
// Deactivate Company Validator
// -----------------------------
export const deactivateCompanyValidator = [
  param("id").isMongoId().withMessage("Invalid company ID"),
  validationMiddleware,
];

// -----------------------------
// Activate Company Validator
// -----------------------------
export const activateCompanyValidator = [
  param("id").isMongoId().withMessage("Invalid company ID"),
  validationMiddleware,
];
