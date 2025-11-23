import { check } from "express-validator";
import validatorMiddleware from "../../../middlewares/validatorMiddleware.js";

export const createNotificationValidator = [
  check("title")
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ max: 100 })
    .withMessage("Title must be less than 100 characters"),

  check("message")
    .notEmpty()
    .withMessage("Message is required")
    .isLength({ max: 500 })
    .withMessage("Message must be less than 500 characters"),

  check("module")
    .optional()
    .isIn(["system", "loads", "trucks", "drivers", "identity"])
    .withMessage("Invalid module type"),

  check("importance")
    .optional()
    .isIn(["low", "medium", "high"])
    .withMessage("Invalid importance"),

  check("from").optional().isString().withMessage("From must be a string"),

  check("toRole")
    .optional()
    .isArray()
    .withMessage("toRole must be an array")
    .bail()
    .custom((arr) => arr.every((item) => typeof item === "string"))
    .withMessage("Each role in toRole must be a string"),

  check("toUser").optional().isMongoId().withMessage("Invalid user ID"),

  validatorMiddleware,
];

export const getNotificationValidator = [
  check("id").isMongoId().withMessage("Invalid notification ID"),
  validatorMiddleware,
];

export const markAsReadValidator = [
  check("id").isMongoId().withMessage("Invalid notification ID"),
  validatorMiddleware,
];
