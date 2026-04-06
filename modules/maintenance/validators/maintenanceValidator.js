import { body, param } from "express-validator";
import validationMiddleware from "../../../middlewares/validatorMiddleware.js";

const ALLOWED_REPEAT = ["time", "mile"];

// -----------------------------
// Helper Validators
// -----------------------------
const statusPerTruckValidator = (repeatBy, isRequired = true) => {
  let validator = body("statusPerTruck");

  if (isRequired) {
    validator = validator
      .exists({ checkNull: true })
      .withMessage("statusPerTruck is required");
  }

  return validator
    .bail()
    .isArray({ min: 1 })
    .withMessage("statusPerTruck must be a non-empty array")
    .bail()
    .custom((arr) => {
      arr.forEach((t, idx) => {
        if (!t.truck) throw new Error(`truck is required at index ${idx}`);
        if (repeatBy === "time") {
          if (!t.lastDoneAt)
            throw new Error(`lastDoneAt is required for truck at index ${idx}`);
        }
        if (repeatBy === "mile") {
          if (t.lastDoneMile === undefined || t.lastDoneMile === null)
            throw new Error(
              `lastDoneMile is required for truck at index ${idx}`,
            );
        }
      });
      return true;
    });
};

// -----------------------------
// Create Maintenance Validator
// -----------------------------
export const createMaintenanceValidator = [
  body("type").exists({ checkFalsy: true }).withMessage("type is required"),
  body("repeatBy")
    .exists({ checkFalsy: true })
    .withMessage("repeatBy is required")
    .bail()
    .isIn(ALLOWED_REPEAT)
    .withMessage("repeatBy must be: time | mile"),

  // Intervals & Reminders required depending on repeatBy
  body("intervalDays").custom((value, { req }) => {
    if (
      req.body.repeatBy === "time" &&
      (value === undefined || value === null)
    ) {
      throw new Error("intervalDays is required when repeatBy = time");
    }
    return true;
  }),
  body("remindBeforeDays").custom((value, { req }) => {
    if (
      req.body.repeatBy === "time" &&
      (value === undefined || value === null)
    ) {
      throw new Error("remindBeforeDays is required when repeatBy = time");
    }
    return true;
  }),
  body("intervalMile").custom((value, { req }) => {
    if (
      req.body.repeatBy === "mile" &&
      (value === undefined || value === null)
    ) {
      throw new Error("intervalMile is required when repeatBy = mile");
    }
    return true;
  }),
  body("remindBeforeMile").custom((value, { req }) => {
    if (
      req.body.repeatBy === "mile" &&
      (value === undefined || value === null)
    ) {
      throw new Error("remindBeforeMile is required when repeatBy = mile");
    }
    return true;
  }),

  // statusPerTruck validator
  body("repeatBy").custom((value, { req }) => {
    return statusPerTruckValidator(value, true).run(req);
  }),

  body("serviceCenter")
    .optional()
    .isMongoId()
    .withMessage("Invalid service center ID"),

  validationMiddleware,
];

// -----------------------------
// Update Maintenance Validator
// -----------------------------
export const updateMaintenanceValidator = [
  param("id").isMongoId().withMessage("Invalid maintenance ID"),

  // optional fields
  body("type").optional().notEmpty().withMessage("type cannot be empty"),
  body("repeatBy")
    .optional()
    .isIn(ALLOWED_REPEAT)
    .withMessage("repeatBy must be: time | mile"),

  // Intervals & Reminders only required if repeatBy is provided or field exists
  body("intervalDays").custom((value, { req }) => {
    const repeatBy = req.body.repeatBy || req.existingRepeatBy;
    if (
      repeatBy === "time" &&
      value === undefined &&
      req.body.hasOwnProperty("intervalDays")
    ) {
      throw new Error("intervalDays is required when repeatBy = time");
    }
    return true;
  }),
  body("remindBeforeDays").custom((value, { req }) => {
    const repeatBy = req.body.repeatBy || req.existingRepeatBy;
    if (
      repeatBy === "time" &&
      value === undefined &&
      req.body.hasOwnProperty("remindBeforeDays")
    ) {
      throw new Error("remindBeforeDays is required when repeatBy = time");
    }
    return true;
  }),
  body("intervalMile").custom((value, { req }) => {
    const repeatBy = req.body.repeatBy || req.existingRepeatBy;
    if (
      repeatBy === "mile" &&
      value === undefined &&
      req.body.hasOwnProperty("intervalMile")
    ) {
      throw new Error("intervalMile is required when repeatBy = mile");
    }
    return true;
  }),
  body("remindBeforeMile").custom((value, { req }) => {
    const repeatBy = req.body.repeatBy || req.existingRepeatBy;
    if (
      repeatBy === "mile" &&
      value === undefined &&
      req.body.hasOwnProperty("remindBeforeMile")
    ) {
      throw new Error("remindBeforeMile is required when repeatBy = mile");
    }
    return true;
  }),

  // statusPerTruck optional validator
  body("statusPerTruck")
    .optional()
    .custom((arr, { req }) => {
      const repeatBy = req.body.repeatBy || req.existingRepeatBy;
      return statusPerTruckValidator(repeatBy, false).run(req);
    }),

  body("serviceCenter")
    .optional()
    .isMongoId()
    .withMessage("Invalid service center ID"),

  validationMiddleware,
];

// -----------------------------
// Get Single Maintenance Validator
// -----------------------------
export const getMaintenanceValidator = [
  param("id").isMongoId().withMessage("Invalid maintenance ID"),
  validationMiddleware,
];

// -----------------------------
// Delete Maintenance Validator
// -----------------------------
export const deleteMaintenanceValidator = [
  param("id").isMongoId().withMessage("Invalid maintenance ID"),
  validationMiddleware,
];
