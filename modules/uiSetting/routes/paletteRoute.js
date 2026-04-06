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
import { setCompany } from "../../../middlewares/companyMiddleware.js";

// Protect all routes
router.use(protect);
router.use(setCompany);

router
  .route("/")
  .get(getAllPalettes)
  .post(allowedTo("admin"), createPaletteValidator, createPalette);

router
  .route("/:id")
  .get(getPaletteValidator, getPaletteById)
  .patch(allowedTo("admin"), updatePaletteValidator, updatePalette)
  .delete(allowedTo("admin"), deletePalette);

export default router;
