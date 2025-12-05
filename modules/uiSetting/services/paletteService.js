import asyncHandler from "express-async-handler";
import ApiError from "../../../utils/apiError.js";
import paletteModel from "../models/paletteModel.js";
import Logger from "../../../utils/loggerService.js";
import {
  createService,
  getAllService,
  getSpecificService,
  updateService,
  deleteService,
} from "../../../utils/servicesHandler.js";

const logger = new Logger("palette");

// Create Palette
export const createPaletteService = asyncHandler(async (body, userId) => {
  const { mode } = body;

  // 🛑 Mode is required
  if (!mode) {
    await logger.error("Palette creation failed - mode is missing");
    throw new ApiError("🛑 Mode is required to create a palette", 400);
  }

  if (body.active === true) {
    // Set all other palettes' active to false
    await paletteModel.updateMany(
      { active: true },
      {
        active: false,
        updatedBy: userId,
      }
    );
    await logger.info(
      "All other palettes deactivated for new palette creation"
    );
  }

  const newPalette = await createService(paletteModel, {
    ...body,
    createdBy: userId,
  });

  await logger.info("Palette created successfully", {
    id: newPalette._id,
    mode,
  });
  return newPalette;
});

// Get All Palettes
export const getAllPalettesService = asyncHandler(async (req) => {
  const result = await getAllService(paletteModel, req.query, "palette");

  await logger.info("Fetched all palettes");

  return {
    results: result.results,
    data: result.data,
    paginationResult: result.paginationResult,
  };
});

// Get Palette By ID
export const getPaletteByIdService = asyncHandler(async (id) => {
  const palette = await getSpecificService(paletteModel, id);

  if (!palette) {
    await logger.error("Palette not found", { id });
    throw new ApiError("🛑 Palette not found", 404);
  }

  await logger.info("Fetched palette", { id });
  return palette;
});

// Update Palette
export const updatePaletteService = asyncHandler(async (id, body, userId) => {
  const palette = await paletteModel.findById(id);
  if (!palette) {
    await logger.error("Palette not found", { id });
    throw new ApiError(
      `🛑 Cannot update. No palette found with ID: ${id}`,
      404
    );
  }

  // Check if updating active field to true
  if (body.active === true) {
    // Set all other palettes' active to false
    await paletteModel.updateMany(
      { _id: { $ne: id }, active: true },
      {
        active: false,
        updatedBy: userId,
      }
    );
    await logger.info("All other palettes deactivated", {
      activatedPalette: id,
    });
  }

  const updatedPalette = await updateService(paletteModel, id, {
    ...body,
    updatedBy: userId,
  });

  await logger.info("Palette updated successfully", { id });
  return updatedPalette;
});

// Delete Palette
export const deletePaletteService = asyncHandler(async (id) => {
  const palette = await paletteModel.findById(id);
  if (!palette) {
    await logger.error("Palette not found", { id });
    throw new ApiError("🛑 Palette not found", 404);
  }

  await deleteService(paletteModel, id);

  await logger.info("Palette deleted successfully", { id });
  return;
});
