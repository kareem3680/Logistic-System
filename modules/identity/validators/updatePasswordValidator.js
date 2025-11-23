import { check } from "express-validator";

import validatorMiddleWare from "../../../middlewares/validatorMiddleware.js";

export const updatePasswordValidator = [
  check("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),

  check("newPassword")
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

  check("newPasswordConfirm")
    .notEmpty()
    .withMessage("newPasswordConfirm is required")
    .custom((confirm, { req }) => {
      if (confirm !== req.body.newPassword) {
        throw new Error("newPasswordConfirm does not match NewPassword");
      }
      return true;
    }),

  validatorMiddleWare,
];
