import { check } from "express-validator";

import validatorMiddleWare from "../../../middlewares/validatorMiddleware.js";

export const getUserValidator = [
  check("id").isMongoId().withMessage("Invalid User Id Format"),
  validatorMiddleWare,
];

export const createUserValidator = [
  check("name")
    .notEmpty()
    .withMessage("name is required")
    .isLength({ min: 3 })
    .withMessage("name must be at least 3 characters")
    .isLength({ max: 30 })
    .withMessage("name must be at most 30 characters"),

  check("email")
    .notEmpty()
    .withMessage("email is required")
    .isEmail()
    .withMessage("email must be valid"),

  check("phone").optional(),
  check("password")
    .notEmpty()
    .withMessage("password is required")
    .isLength({ min: 5 })
    .withMessage("password must be at least 5 characters")
    .custom((password) => {
      const invalidFormat = !/(?=.*[a-zA-Z])(?=.*\d)/.test(password);
      if (invalidFormat) {
        throw new Error(
          "Password must contain at least one letter and one number"
        );
      }
      return true;
    }),

  check("passwordConfirmation")
    .notEmpty()
    .withMessage("password confirmation is required")
    .custom((confirm, { req }) => {
      if (confirm !== req.body.password) {
        throw new Error("Password confirmation does not match password");
      }
      return true;
    }),

  check("position")
    .optional()
    .isString()
    .withMessage("Position must be a string"),

  validatorMiddleWare,
];

export const updateUserValidator = [
  check("id").isMongoId().withMessage("Invalid User Id Format"),

  check("role")
    .optional()
    .isIn(["admin", "employee"])
    .withMessage("[Role must be either admin, employee]"),

  check("position")
    .optional()
    .isString()
    .withMessage("Position must be a string"),

  validatorMiddleWare,
];

export const deactivateUserValidator = [
  check("id").isMongoId().withMessage("Invalid User Id Format"),
  validatorMiddleWare,
];

export const activateUserValidator = [
  check("id").isMongoId().withMessage("Invalid User Id Format"),
  validatorMiddleWare,
];
