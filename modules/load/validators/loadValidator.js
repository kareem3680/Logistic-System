import { check } from "express-validator";
import validatorMiddleWare from "../../../middlewares/validatorMiddleware.js";

export const getLoadValidator = [
  check("id").isMongoId().withMessage("Invalid Load Id Format"),
  validatorMiddleWare,
];

export const createLoadValidator = [
  check("origin.address")
    .notEmpty()
    .withMessage("Origin address is required")
    .isString()
    .withMessage("Origin address must be a string"),

  check("DHO.address")
    .notEmpty()
    .withMessage("DHO address is required")
    .isString()
    .withMessage("DHO address must be a string"),

  check("destination")
    .isArray({ min: 1 })
    .withMessage("Destination must be a non-empty array"),
  check("destination.*.address")
    .notEmpty()
    .withMessage("Each destination address is required")
    .isString()
    .withMessage("Each destination address must be a string"),

  check("pickupAt")
    .notEmpty()
    .withMessage("pickupAt is required")
    .isISO8601()
    .withMessage("pickupAt must be a valid date"),

  check("completedAt")
    .notEmpty()
    .withMessage("completedAt is required")
    .isISO8601()
    .withMessage("completedAt must be a valid date"),

  check("documents")
    .optional()
    .isArray({ min: 1 })
    .withMessage("Documents must be a non-empty array"),
  check("documents.*.fileId")
    .notEmpty()
    .withMessage("Each document must have a fileId")
    .isString()
    .withMessage("fileId must be a string"),
  check("documents.*.viewLink")
    .notEmpty()
    .withMessage("Each document must have a viewLink")
    .isURL()
    .withMessage("viewLink must be a valid URL"),
  check("documents.*.downloadLink")
    .notEmpty()
    .withMessage("Each document must have a downloadLink")
    .isURL()
    .withMessage("downloadLink must be a valid URL"),

  check("loadId")
    .notEmpty()
    .withMessage("loadId is required")
    .isString()
    .withMessage("loadId must be a string"),

  check("driverId")
    .notEmpty()
    .withMessage("driverId is required")
    .isMongoId()
    .withMessage("Invalid driverId"),

  check("truckId")
    .notEmpty()
    .withMessage("truckId is required")
    .isMongoId()
    .withMessage("Invalid truckId"),

  check("truckType")
    .notEmpty()
    .withMessage("truckType is required")
    .toLowerCase()
    .isIn(["van", "reefer"])
    .withMessage("truckType must be one of [van, reefer]"),

  check("truckTemp").custom((value, { req }) => {
    if (req.body.truckType === "reefer") {
      if (value === undefined || value === null || value === "")
        throw new Error("truckTemp is required for reefer trucks");
      if (isNaN(value)) throw new Error("truckTemp must be a valid number");
    }
    return true;
  }),

  check("distanceMiles")
    .notEmpty()
    .withMessage("distanceMiles is required")
    .isFloat({ min: 0.01 })
    .withMessage("distanceMiles must be greater than 0"),

  check("pricePerMile")
    .notEmpty()
    .withMessage("pricePerMile is required")
    .isFloat({ min: 0.01 })
    .withMessage("pricePerMile must be greater than 0"),

  check("totalPrice")
    .notEmpty()
    .withMessage("totalPrice is required")
    .isFloat({ min: 0.01 })
    .withMessage("totalPrice must be greater than 0"),

  check("currency")
    .optional()
    .isIn(["USD", "EUR", "EGP", "GBP", "SAR"])
    .withMessage("currency must be one of [USD, EUR, EGP, GBP, SAR]"),

  check("feesNumber")
    .optional()
    .isString()
    .withMessage("feesNumber must be a string"),

  validatorMiddleWare,
];

export const updateLoadValidator = [
  check("origin.address")
    .optional()
    .notEmpty()
    .withMessage("Origin address is required if provided")
    .isString()
    .withMessage("Origin address must be a string"),

  check("DHO.address")
    .optional()
    .notEmpty()
    .withMessage("DHO address is required if provided")
    .isString()
    .withMessage("DHO address must be a string"),

  check("destination")
    .optional()
    .isArray({ min: 1 })
    .withMessage("Destination must be a non-empty array"),
  check("destination.*.address")
    .optional()
    .notEmpty()
    .withMessage("Each destination address is required if provided")
    .isString()
    .withMessage("Each destination address must be a string"),

  check("pickupAt")
    .optional()
    .isISO8601()
    .withMessage("pickupAt must be a valid date"),

  check("completedAt")
    .optional()
    .isISO8601()
    .withMessage("completedAt must be a valid date"),

  check("arrivalAtShipper")
    .optional()
    .isISO8601()
    .withMessage("arrivalAtShipper must be a valid date"),

  check("leftShipper")
    .optional()
    .isISO8601()
    .withMessage("leftShipper must be a valid date"),

  check("arrivalAtReceiver")
    .optional()
    .isISO8601()
    .withMessage("arrivalAtReceiver must be a valid date"),

  check("leftReceiver")
    .optional()
    .isISO8601()
    .withMessage("leftReceiver must be a valid date"),

  check("deliveredAt")
    .optional()
    .isISO8601()
    .withMessage("deliveredAt must be a valid date"),

  check("cancelledAt")
    .optional()
    .isISO8601()
    .withMessage("cancelledAt must be a valid date"),

  check("documents")
    .optional()
    .isArray({ min: 1 })
    .withMessage("Documents must be a non-empty array"),
  check("documents.*.fileId")
    .optional()
    .notEmpty()
    .withMessage("Each document must have a fileId")
    .isString()
    .withMessage("fileId must be a string"),
  check("documents.*.viewLink")
    .optional()
    .notEmpty()
    .withMessage("Each document must have a viewLink")
    .isURL()
    .withMessage("viewLink must be a valid URL"),
  check("documents.*.downloadLink")
    .optional()
    .notEmpty()
    .withMessage("Each document must have a downloadLink")
    .isURL()
    .withMessage("downloadLink must be a valid URL"),

  check("distanceMiles")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("distanceMiles must be a positive number"),

  check("pricePerMile")
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage("pricePerMile must be positive"),

  check("totalPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("totalPrice must be positive"),

  check("feesNumber")
    .optional()
    .isString()
    .withMessage("feesNumber must be a string"),

  validatorMiddleWare,
];

export const updateLoadStatusValidator = [
  check("id").isMongoId().withMessage("Invalid Load Id Format"),

  check("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["pending", "in_transit", "delivered", "cancelled"])
    .withMessage(
      "Status must be one of [pending, in_transit, delivered, cancelled]"
    ),

  check("deliveredAt")
    .optional()
    .isISO8601()
    .withMessage("deliveredAt must be a valid date"),

  check("cancelledAt")
    .optional()
    .isISO8601()
    .withMessage("cancelledAt must be a valid date"),

  validatorMiddleWare,
];
