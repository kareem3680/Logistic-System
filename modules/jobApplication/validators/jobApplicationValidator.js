import { check } from "express-validator";
import validatorMiddleWare from "../../../middlewares/validatorMiddleware.js";

export const createJobApplicationValidator = [
  check("fullName").notEmpty().withMessage("Full name is required"),
  check("email").isEmail().withMessage("Valid email is required"),
  check("phone").notEmpty().withMessage("Phone is required"),
  check("jobTitle").notEmpty().withMessage("Job title is required"),
  check("location").notEmpty().withMessage("Location is required"),
  check("cvLink").isURL().withMessage("CV link must be a valid URL"),
  check("experienceYears")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Experience must be a non-negative number"),
  check("skills")
    .optional()
    .isArray()
    .withMessage("Skills must be an array of strings"),
  validatorMiddleWare,
];

export const updateJobApplicationStatusValidator = [
  check("id").isMongoId().withMessage("Invalid application ID"),
  check("status")
    .notEmpty()
    .isIn(["pending", "reviewed", "accepted", "rejected"])
    .withMessage("Invalid status"),
  validatorMiddleWare,
];
