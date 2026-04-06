import { param, check } from "express-validator";
import validatorMiddleWare from "../../../middlewares/validatorMiddleware.js";

export const addDriverDocumentsValidator = [
  param("id")
    .notEmpty()
    .withMessage("Load ID is required")
    .isMongoId()
    .withMessage("Invalid Load ID format"),
  validatorMiddleWare,
];

export const updateLoadAppointmentValidator = [
  check("arrivalAtShipper")
    .optional()
    .isISO8601()
    .withMessage("arrivalAtShipper must be a valid date"),

  check("leftShipper")
    .optional()
    .isISO8601()
    .withMessage("leftShipper must be a valid date"),

  check("arrivalAtReceiver")
    .optional()
    .isISO8601()
    .withMessage("arrivalAtReceiver must be a valid date"),

  check("leftReceiver")
    .optional()
    .isISO8601()
    .withMessage("leftReceiver must be a valid date"),

  validatorMiddleWare,
];
