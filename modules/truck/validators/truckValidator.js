import { check } from "express-validator";
import validatorMiddleWare from "../../../middlewares/validatorMiddleware.js";

export const getTruckValidator = [
  check("id").isMongoId().withMessage("Invalid Truck Id Format"),
  validatorMiddleWare,
];

export const createTruckValidator = [
  check("plateNumber")
    .notEmpty()
    .withMessage("Truck plate number is required")
    .isLength({ min: 3 })
    .withMessage("Plate number must be at least 3 characters")
    .isLength({ max: 15 })
    .withMessage("Plate number must be at most 15 characters"),

  check("model")
    .notEmpty()
    .withMessage("Truck model is required")
    .isLength({ min: 2 })
    .withMessage("Model must be at least 2 characters")
    .isLength({ max: 30 })
    .withMessage("Model must be at most 30 characters"),

  check("type")
    .notEmpty()
    .withMessage("Truck type is required")
    .isIn(["van", "reefer", "flatbed", "box", "tanker"])
    .withMessage("Invalid truck type"),

  check("source")
    .notEmpty()
    .withMessage("Truck source is required")
    .isIn(["company", "other"])
    .withMessage("Invalid truck source"),

  check("year")
    .notEmpty()
    .withMessage("Truck manufacturing year is required")
    .isInt({ min: 2010, max: new Date().getFullYear() + 1 })
    .withMessage("Year must be a valid number between 2010 and next year"),

  check("totalMileage")
    .notEmpty()
    .withMessage("totalMileage is required")
    .isNumeric()
    .withMessage("totalMileage must be a number")
    .custom((value) => value >= 0)
    .withMessage("totalMileage must be greater than or equal to 0"),

  check("capacity")
    .notEmpty()
    .withMessage("Truck capacity is required")
    .isNumeric()
    .withMessage("Truck capacity must be a number"),

  check("fuelPerMile")
    .notEmpty()
    .withMessage("fuelPerMile is required")
    .isNumeric()
    .withMessage("fuelPerMile must be a number"),

  check("status")
    .optional()
    .isIn(["available", "inactive", "busy"])
    .withMessage("Invalid status value"),

  check("assignedDriver")
    .optional()
    .isMongoId()
    .withMessage("Invalid Driver Id Format"),

  validatorMiddleWare,
];

export const updateTruckValidator = [
  check("id").isMongoId().withMessage("Invalid Truck Id Format"),

  check("plateNumber")
    .optional()
    .isLength({ min: 3 })
    .withMessage("Plate number must be at least 3 characters")
    .isLength({ max: 15 })
    .withMessage("Plate number must be at most 15 characters"),

  check("model")
    .optional()
    .isLength({ min: 2 })
    .withMessage("Model must be at least 2 characters")
    .isLength({ max: 30 })
    .withMessage("Model must be at most 30 characters"),

  check("source")
    .optional()
    .isIn(["company", "other"])
    .withMessage("Invalid truck source"),

  check("year")
    .optional()
    .isInt({ min: 2010, max: new Date().getFullYear() + 1 })
    .withMessage("Year must be a valid number between 2010 and next year"),

  check("totalMileage")
    .optional()
    .isNumeric()
    .withMessage("totalMileage must be a number")
    .custom((value) => value >= 0)
    .withMessage("totalMileage must be greater than or equal to 0"),

  check("capacity")
    .optional()
    .isNumeric()
    .withMessage("Truck capacity must be a number"),

  check("fuelPerMile")
    .optional()
    .isNumeric()
    .withMessage("fuelPerMile must be a number"),

  check("status")
    .optional()
    .isIn(["available", "inactive", "busy"])
    .withMessage("Invalid status value"),

  check("assignedDriver")
    .optional()
    .isMongoId()
    .withMessage("Invalid Driver Id Format"),

  validatorMiddleWare,
];

export const deleteTruckValidator = [
  check("id").isMongoId().withMessage("Invalid Truck Id Format"),
  validatorMiddleWare,
];
