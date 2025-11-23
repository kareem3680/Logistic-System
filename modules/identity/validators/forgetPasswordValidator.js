import { check } from "express-validator";
import validatorMiddleWare from "../../../middlewares/validatorMiddleware.js";

export const sendResetCodeValidator = [
  check("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format"),
  validatorMiddleWare,
];

export const resendResetCodeValidator = [
  check("email").isEmail().withMessage("Valid email is required"),
  validatorMiddleWare,
];

export const verifyResetCodeValidator = [
  check("resetCode").notEmpty().withMessage("resetCode is required"),
  validatorMiddleWare,
];

export const resetPasswordValidator = [
  check("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format"),

  check("newPassword")
    .notEmpty()
    .withMessage("newPassword is required")
    .isLength({ min: 5 })
    .withMessage("newPassword must be at least 5 characters")
    .custom((password) => {
      const invalidFormat = !/(?=.*[a-zA-Z])(?=.*\d)/.test(password);
      if (invalidFormat) {
        throw new Error(
          "Password must contain at least one letter and one number"
        );
      }
      return true;
    }),

  check("confirmNewPassword")
    .notEmpty()
    .withMessage("confirmNewPassword is required")
    .custom((confirm, { req }) => {
      if (confirm !== req.body.newPassword) {
        throw new Error("confirmNewPassword does not match newPassword");
      }
      return true;
    }),

  validatorMiddleWare,
];
