import { check } from "express-validator";
import validatorMiddleWare from "../../../middlewares/validatorMiddleware.js";

export const createTimeOffValidator = [
  check("from")
    .notEmpty()
    .withMessage("Start date is required")
    .isISO8601()
    .withMessage("Invalid date format"),
  check("to")
    .notEmpty()
    .withMessage("End date is required")
    .isISO8601()
    .withMessage("Invalid date format"),
  check("reason")
    .notEmpty()
    .withMessage("Reason is required")
    .isString()
    .withMessage("Reason must be a string"),
  validatorMiddleWare,
];

export const getAllTimeOffValidator = [
  check("status")
    .optional()
    .isIn(["pending", "approved", "rejected"])
    .withMessage("Invalid status"),
  check("driverId").optional().isMongoId().withMessage("Invalid driver ID"),
  validatorMiddleWare,
];

export const updateTimeOffStatusValidator = [
  check("id").isMongoId().withMessage("Invalid TimeOff ID"),
  check("status")
    .notEmpty()
    .isIn(["approved", "rejected"])
    .withMessage("Status must be 'approved' or 'rejected'"),
  validatorMiddleWare,
];

export const cancelTimeOffValidator = [
  check("id").isMongoId().withMessage("Invalid TimeOff Id Format"),
  validatorMiddleWare,
];
