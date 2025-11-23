import { check } from "express-validator";
import validatorMiddleware from "../../../middlewares/validatorMiddleware.js";

export const saveFcmTokenValidator = [
  check("fcmToken")
    .notEmpty()
    .withMessage("FCM token is required")
    .isString()
    .withMessage("FCM token must be a string"),
  validatorMiddleware,
];
