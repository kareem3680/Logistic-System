import { check } from "express-validator";
import validatorMiddleWare from "../../../middlewares/validatorMiddleware.js";

export const getDriverSummaryValidator = [
  check("id").isMongoId().withMessage("Invalid Driver Id Format"),

  check("from")
    .optional()
    .isISO8601()
    .withMessage("from date must be a valid ISO8601 date"),

  check("to")
    .optional()
    .isISO8601()
    .withMessage("to date must be a valid ISO8601 date"),

  validatorMiddleWare,
];

export const getTruckSummaryValidator = [
  check("id").isMongoId().withMessage("Invalid truck ID format"),

  check("from")
    .optional()
    .isISO8601()
    .withMessage("Invalid date format for 'from'"),
  check("to")
    .optional()
    .isISO8601()
    .withMessage("Invalid date format for 'to'"),

  validatorMiddleWare,
];

export const getAllTrucksSummaryValidator = [
  check("from")
    .optional()
    .isISO8601()
    .withMessage("Invalid date format for 'from'"),
  check("to")
    .optional()
    .isISO8601()
    .withMessage("Invalid date format for 'to'"),

  validatorMiddleWare,
];
