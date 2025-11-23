import { check } from "express-validator";
import validatorMiddleWare from "../../../middlewares/validatorMiddleware.js";

export const addCommentValidator = [
  check("loadId").isMongoId().withMessage("Invalid Load Id Format"),

  check("text")
    .notEmpty()
    .withMessage("Comment text is required")
    .isString()
    .withMessage("Comment text must be a string")
    .isLength({ min: 1, max: 500 })
    .withMessage("Comment text must be between 1 and 500 characters"),

  check("type")
    .if((value, { req }) => req.user.role !== "driver")
    .notEmpty()
    .withMessage("Comment type is required")
    .isIn(["dispatcher", "driver"])
    .withMessage("Comment type must be either dispatcher or driver"),

  validatorMiddleWare,
];

export const updateCommentValidator = [
  check("loadId").isMongoId().withMessage("Invalid Load Id Format"),

  check("commentId").isMongoId().withMessage("Invalid Comment Id Format"),

  check("text")
    .notEmpty()
    .withMessage("Updated comment text is required")
    .isString()
    .withMessage("Updated comment text must be a string")
    .isLength({ min: 1, max: 500 })
    .withMessage("Comment text must be between 1 and 500 characters"),

  check("type")
    .if((value, { req }) => req.user.role !== "driver")
    .notEmpty()
    .withMessage("Comment type is required")
    .isIn(["dispatcher", "driver"])
    .withMessage("Comment type must be either dispatcher or driver"),
  validatorMiddleWare,
];

export const deleteCommentValidator = [
  check("loadId").isMongoId().withMessage("Invalid Load Id Format"),
  check("commentId").isMongoId().withMessage("Invalid Comment Id Format"),
  validatorMiddleWare,
];

export const getCommentsValidator = [
  check("loadId").isMongoId().withMessage("Invalid Load Id Format"),
  validatorMiddleWare,
];
