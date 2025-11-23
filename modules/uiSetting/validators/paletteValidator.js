import { check } from "express-validator";
import validatorMiddleWare from "../../../middlewares/validatorMiddleware.js";

// GET Palette Validator
export const getPaletteValidator = [validatorMiddleWare];

// CREATE Palette Validator
export const createPaletteValidator = [
  check("mode").optional().isString().withMessage("Mode must be a string"),

  check("customName")
    .optional()
    .isString()
    .withMessage("Custom name must be a string"),

  check("title").optional().isString().withMessage("Title must be a string"),

  check("active")
    .optional()
    .isBoolean()
    .withMessage("Active must be true or false")
    .toBoolean(),

  check("background.default")
    .optional()
    .notEmpty()
    .withMessage("Background default color cannot be empty")
    .isString()
    .withMessage("Background default must be a string"),

  check("background.paper")
    .optional()
    .notEmpty()
    .withMessage("Background paper color cannot be empty")
    .isString()
    .withMessage("Background paper must be a string"),

  check("primary.main")
    .optional()
    .notEmpty()
    .withMessage("Primary main color cannot be empty")
    .isString()
    .withMessage("Primary main must be a string"),

  check("primary.contrastText")
    .optional()
    .notEmpty()
    .withMessage("Primary contrastText color cannot be empty")
    .isString()
    .withMessage("Primary contrastText must be a string"),

  check("secondary.main")
    .optional()
    .notEmpty()
    .withMessage("Secondary main color cannot be empty")
    .isString()
    .withMessage("Secondary main must be a string"),

  check("secondary.contrastText")
    .optional()
    .notEmpty()
    .withMessage("Secondary contrastText color cannot be empty")
    .isString()
    .withMessage("Secondary contrastText must be a string"),

  check("text.primary")
    .optional()
    .notEmpty()
    .withMessage("Text primary color cannot be empty")
    .isString()
    .withMessage("Text primary must be a string"),

  check("text.secondary")
    .optional()
    .notEmpty()
    .withMessage("Text secondary color cannot be empty")
    .isString()
    .withMessage("Text secondary must be a string"),

  validatorMiddleWare,
];

// UPDATE Palette Validator
export const updatePaletteValidator = [
  check("id").isMongoId().withMessage("Invalid palette id format"),
  ...createPaletteValidator,
];
