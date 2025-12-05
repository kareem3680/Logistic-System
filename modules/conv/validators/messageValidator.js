import { check, param } from "express-validator";
import validatorMiddleware from "../../../middlewares/validatorMiddleware.js";

// Send Message Validator
export const sendMessageValidator = [
  param("id")
    .notEmpty()
    .withMessage("conversationId is required")
    .isMongoId()
    .withMessage("Invalid conversationId format"),

  check("text")
    .notEmpty()
    .withMessage("Message text is required")
    .isString()
    .withMessage("Message text must be a string"),

  validatorMiddleware,
];

// Get Messages Validator
export const getMessagesValidator = [
  param("id")
    .notEmpty()
    .withMessage("conversationId is required")
    .isMongoId()
    .withMessage("Invalid conversationId format"),

  validatorMiddleware,
];

// Mark Messages Seen Validator
export const markSeenValidator = [
  param("id")
    .notEmpty()
    .withMessage("conversationId is required")
    .isMongoId()
    .withMessage("Invalid conversationId format"),

  validatorMiddleware,
];
