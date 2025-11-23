import { check } from "express-validator";
import validatorMiddleWare from "../../../middlewares/validatorMiddleware.js";

export const getCustomerValidator = [
  check("id").isMongoId().withMessage("Invalid Customer Id Format"),
  validatorMiddleWare,
];

export const createCustomerValidator = [
  check("name")
    .notEmpty()
    .withMessage("Customer name is required")
    .isLength({ min: 3 })
    .withMessage("Name must be at least 3 characters")
    .isLength({ max: 50 })
    .withMessage("Name must be at most 50 characters"),

  check("phone").notEmpty().withMessage("Phone number is required"),

  check("email").optional().isEmail().withMessage("Invalid email format"),

  check("address").notEmpty().withMessage("address is required"),

  check("type")
    .notEmpty()
    .withMessage("Type is required")
    .isIn(["shipper", "receiver"])
    .withMessage("Invalid type value"),

  check("feedback")
    .optional()
    .isLength({ max: 300 })
    .withMessage("Feedback too long"),

  validatorMiddleWare,
];

export const updateCustomerValidator = [
  check("id").isMongoId().withMessage("Invalid Customer Id Format"),

  check("name")
    .optional()
    .isLength({ min: 3 })
    .withMessage("Name must be at least 3 characters")
    .isLength({ max: 50 })
    .withMessage("Name must be at most 50 characters"),

  check("email").optional().isEmail().withMessage("Invalid email format"),

  check("phone").optional(),

  check("address").optional(),

  check("type")
    .optional()
    .isIn(["shipper", "receiver"])
    .withMessage("Invalid type value"),

  check("feedback")
    .optional()
    .isLength({ max: 300 })
    .withMessage("Feedback too long"),

  validatorMiddleWare,
];

export const deleteCustomerValidator = [
  check("id").isMongoId().withMessage("Invalid Customer Id Format"),
  validatorMiddleWare,
];
