import asyncHandler from "express-async-handler";
import {
  getAllPalettesService,
  getPaletteByIdService,
  createPaletteService,
  updatePaletteService,
  deletePaletteService,
} from "../services/paletteService.js";

// Get All Palettes
export const getAllPalettes = asyncHandler(async (req, res) => {
  const result = await getAllPalettesService(req, req.companyId, req.user.role);

  res.status(200).json({
    message: "Palettes fetched successfully",
    ...result,
  });
});

// Get Palette By ID
export const getPaletteById = asyncHandler(async (req, res) => {
  const palette = await getPaletteByIdService(
    req.params.id,
    req.companyId,
    req.user.role,
  );

  res.status(200).json({
    message: "Palette fetched successfully",
    data: palette,
  });
});

// Create Palette
export const createPalette = asyncHandler(async (req, res) => {
  const palette = await createPaletteService(
    req.body,
    req.user._id,
    req.companyId,
    req.user.role,
  );

  res.status(201).json({
    message: "Palette created successfully",
    data: palette,
  });
});

// Update Palette
export const updatePalette = asyncHandler(async (req, res) => {
  const palette = await updatePaletteService(
    req.params.id,
    req.body,
    req.user._id,
    req.companyId,
    req.user.role,
  );

  res.status(200).json({
    message: "Palette updated successfully",
    data: palette,
  });
});

// Delete Palette
export const deletePalette = asyncHandler(async (req, res) => {
  await deletePaletteService(req.params.id, req.companyId, req.user.role);

  res.status(200).json({
    message: "Palette deleted successfully",
  });
});
