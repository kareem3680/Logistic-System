import { check } from "express-validator";

import validatorMiddleware from "../../../middlewares/validatorMiddleware.js";

export const createSettingValidator = [
  check("key")
    .notEmpty()
    .withMessage("Key is required")
    .isLength({ min: 2 })
    .withMessage("Key must be at least 2 characters"),

  check("value")
    .notEmpty()
    .withMessage("Value is required")
    .isNumeric()
    .withMessage("Value must be a number"),

  validatorMiddleware,
];

export const updateSettingValidator = [
  check("id").isMongoId().withMessage("Invalid Setting ID format"),

  check("value")
    .notEmpty()
    .withMessage("Value is required")
    .isNumeric()
    .withMessage("Value must be a number"),

  validatorMiddleware,
];
