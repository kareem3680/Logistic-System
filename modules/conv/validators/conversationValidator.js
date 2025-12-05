import { check } from "express-validator";
import validatorMiddleware from "../../../middlewares/validatorMiddleware.js";

// Start Conversation Validator
export const startConversationValidator = [
  check("userId")
    .notEmpty()
    .withMessage("userId is required")
    .isMongoId()
    .withMessage("Invalid userId format"),
  validatorMiddleware,
];
