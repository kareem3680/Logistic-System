import { check } from "express-validator";
import validatorMiddleWare from "../../../middlewares/validatorMiddleware.js";

export const getDriverValidator = [
  check("id").isMongoId().withMessage("Invalid Driver Id Format"),
  validatorMiddleWare,
];

export const createDriverValidator = [
  // name
  check("name")
    .notEmpty()
    .withMessage("Driver name is required")
    .isLength({ min: 3 })
    .withMessage("Name must be at least 3 characters")
    .isLength({ max: 30 })
    .withMessage("Name must be at most 30 characters"),

  // email
  check("email").optional().isEmail().withMessage("Invalid email format"),

  // phone
  check("phone").notEmpty().withMessage("Phone number is required"),

  // licenseNumber
  check("licenseNumber").notEmpty().withMessage("License number is required"),

  // status
  check("status")
    .optional()
    .isIn(["available", "inactive", "busy"])
    .withMessage("Invalid status value"),

  check("toggle")
    .optional()
    .isBoolean()
    .withMessage("Toggle must be boolean")
    .toBoolean(),

  // pricePerMile
  check("pricePerMile")
    .notEmpty()
    .withMessage("Price per mile is required")
    .isFloat({ gt: 0 })
    .withMessage("Price per mile must be positive"),

  // currency
  check("currency")
    .optional()
    .isIn(["USD", "EUR", "EGP", "GBP", "SAR"])
    .withMessage("Invalid currency type"),

  // assignedTruck
  check("assignedTruck")
    .optional()
    .isMongoId()
    .withMessage("Invalid Truck Id Format"),

  // user
  check("user")
    .notEmpty()
    .withMessage("user is required")
    .isMongoId()
    .withMessage("Invalid user Format"),

  // hireDate
  check("hireDate")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage("Invalid hire date format"),

  validatorMiddleWare,
];

export const updateDriverValidator = [
  // id
  check("id").isMongoId().withMessage("Invalid Driver Id Format"),

  // name
  check("name")
    .optional()
    .isLength({ min: 3 })
    .withMessage("Name must be at least 3 characters")
    .isLength({ max: 30 })
    .withMessage("Name must be at most 30 characters"),

  // email
  check("email").optional().isEmail().withMessage("Invalid email format"),

  // phone
  check("phone").optional(),
  // licenseNumber
  check("licenseNumber")
    .optional()
    .notEmpty()
    .withMessage("License number cannot be empty"),

  // status
  check("status")
    .optional()
    .isIn(["available", "inactive", "busy"])
    .withMessage("Invalid status value"),

  check("toggle")
    .optional()
    .isBoolean()
    .withMessage("Toggle must be boolean")
    .toBoolean(),

  // pricePerMile
  check("pricePerMile")
    .optional()
    .isFloat({ gt: 0 })
    .withMessage("Price per mile must be positive"),

  // currency
  check("currency")
    .optional()
    .isIn(["USD", "EUR", "EGP", "GBP", "SAR"])
    .withMessage("Invalid currency type"),

  // assignedTruck
  check("assignedTruck")
    .optional()
    .isMongoId()
    .withMessage("Invalid Truck Id Format"),

  // user
  check("user").optional().isMongoId().withMessage("Invalid user Format"),

  // hireDate
  check("hireDate")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage("Invalid hire date format"),

  validatorMiddleWare,
];

export const deleteDriverValidator = [
  check("id").isMongoId().withMessage("Invalid Driver Id Format"),
  validatorMiddleWare,
];
