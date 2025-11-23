import { param } from "express-validator";
import validatorMiddleWare from "../../../middlewares/validatorMiddleware.js";

export const addDriverDocumentsValidator = [
  param("id")
    .notEmpty()
    .withMessage("Load ID is required")
    .isMongoId()
    .withMessage("Invalid Load ID format"),
  validatorMiddleWare,
];
