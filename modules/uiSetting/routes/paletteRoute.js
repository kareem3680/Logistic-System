import { Router } from "express";
const router = Router();

import {
  getAllPalettes,
  getPaletteById,
  createPalette,
  updatePalette,
  deletePalette,
} from "../controllers/paletteController.js";

import {
  getPaletteValidator,
  createPaletteValidator,
  updatePaletteValidator,
} from "../validators/paletteValidator.js";

import {
  protect,
  allowedTo,
} from "../../identity/controllers/authController.js";

router
  .route("/")
  .get(protect, getPaletteValidator, getAllPalettes)
  .post(protect, allowedTo("admin"), createPaletteValidator, createPalette);

router
  .route("/:id")
  .get(protect, getPaletteValidator, getPaletteById)
  .patch(protect, allowedTo("admin"), updatePaletteValidator, updatePalette)
  .delete(protect, allowedTo("admin"), deletePalette);

export default router;
