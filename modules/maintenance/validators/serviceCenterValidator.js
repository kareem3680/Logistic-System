import { body, param } from "express-validator";
import validationMiddleware from "../../../middlewares/validatorMiddleware.js";

// -----------------------------
// Create Service Center Validator
// -----------------------------
export const createServiceCenterValidator = [
  body("name")
    .exists({ checkFalsy: true })
    .withMessage("name is required")
    .bail()
    .isLength({ min: 3, max: 100 })
    .withMessage("name must be between 3 and 100 characters"),

  body("city")
    .exists({ checkFalsy: true })
    .withMessage("city is required")
    .bail()
    .isLength({ min: 2, max: 50 })
    .withMessage("city must be between 2 and 50 characters"),

  body("state")
    .exists({ checkFalsy: true })
    .withMessage("state is required")
    .bail()
    .isLength({ min: 2, max: 50 })
    .withMessage("state must be between 2 and 50 characters"),

  body("address")
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage("address must be between 5 and 200 characters"),

  body("location")
    .exists({ checkFalsy: true })
    .withMessage("location is required")
    .bail()
    .isObject()
    .withMessage("location must be an object")
    .bail()
    .custom((location) => {
      if (!location.coordinates || !Array.isArray(location.coordinates)) {
        throw new Error(
          "location.coordinates is required and must be an array",
        );
      }
      if (location.coordinates.length !== 2) {
        throw new Error("location.coordinates must be [longitude, latitude]");
      }
      const [lng, lat] = location.coordinates;
      if (typeof lng !== "number" || typeof lat !== "number") {
        throw new Error("coordinates must be numbers");
      }
      if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        throw new Error("Invalid coordinates range");
      }
      return true;
    }),

  body("phone")
    .exists({ checkFalsy: true })
    .withMessage("phone is required")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("phone cannot be empty"),

  body("email")
    .optional()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("active")
    .optional()
    .isBoolean()
    .withMessage("active must be a boolean value"),

  body("availability")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("availability cannot exceed 200 characters"),

  body("services")
    .optional()
    .isArray()
    .withMessage("services must be an array")
    .bail()
    .custom((services) => {
      if (!Array.isArray(services)) return true;
      return services.every(
        (service) => typeof service === "string" && service.trim().length > 0,
      );
    })
    .withMessage("Each service must be a non-empty string"),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("notes cannot exceed 500 characters"),

  validationMiddleware,
];

// -----------------------------
// Update Service Center Validator
// -----------------------------
export const updateServiceCenterValidator = [
  param("id").isMongoId().withMessage("Invalid service center ID"),

  body("name")
    .optional()
    .notEmpty()
    .withMessage("name cannot be empty")
    .bail()
    .isLength({ min: 3, max: 100 })
    .withMessage("name must be between 3 and 100 characters"),

  body("city")
    .optional()
    .notEmpty()
    .withMessage("city cannot be empty")
    .bail()
    .isLength({ min: 2, max: 50 })
    .withMessage("city must be between 2 and 50 characters"),

  body("state")
    .optional()
    .notEmpty()
    .withMessage("state cannot be empty")
    .bail()
    .isLength({ min: 2, max: 50 })
    .withMessage("state must be between 2 and 50 characters"),

  body("address")
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage("address must be between 5 and 200 characters"),

  body("location")
    .optional()
    .isObject()
    .withMessage("location must be an object")
    .bail()
    .custom((location) => {
      if (location.coordinates) {
        if (!Array.isArray(location.coordinates)) {
          throw new Error("location.coordinates must be an array");
        }
        if (location.coordinates.length !== 2) {
          throw new Error("location.coordinates must be [longitude, latitude]");
        }
        const [lng, lat] = location.coordinates;
        if (typeof lng !== "number" || typeof lat !== "number") {
          throw new Error("coordinates must be numbers");
        }
        if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
          throw new Error("Invalid coordinates range");
        }
      }
      return true;
    }),

  body("phone")
    .optional()
    .notEmpty()
    .withMessage("phone cannot be empty")
    .bail()
    .trim(),

  body("email")
    .optional()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("active")
    .optional()
    .isBoolean()
    .withMessage("active must be a boolean value"),

  body("availability")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("availability cannot exceed 200 characters"),

  body("services")
    .optional()
    .isArray()
    .withMessage("services must be an array")
    .bail()
    .custom((services) => {
      if (!Array.isArray(services)) return true;
      return services.every(
        (service) => typeof service === "string" && service.trim().length > 0,
      );
    })
    .withMessage("Each service must be a non-empty string"),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("notes cannot exceed 500 characters"),

  validationMiddleware,
];

// -----------------------------
// Get Single Service Center Validator
// -----------------------------
export const getServiceCenterValidator = [
  param("id").isMongoId().withMessage("Invalid service center ID"),
  validationMiddleware,
];

// -----------------------------
// Delete Service Center Validator
// -----------------------------
export const deleteServiceCenterValidator = [
  param("id").isMongoId().withMessage("Invalid service center ID"),
  validationMiddleware,
];
