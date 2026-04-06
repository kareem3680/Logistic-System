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
import { cacheWrapper, delCache } from "../../../utils/cache.js";

const logger = new Logger("palette");

// Create Palette
export const createPaletteService = asyncHandler(
  async (body, userId, companyId, role) => {
    // Validate company context
    if (role !== "super-admin" && !companyId) {
      throw new ApiError("🛑 Company context is missing", 403);
    }

    const { mode } = body;

    // 🛑 Mode is required
    if (!mode) {
      await logger.error("Palette creation failed - mode is missing");
      throw new ApiError("🛑 Mode is required to create a palette", 400);
    }

    if (body.active === true) {
      // Set all other palettes in the same company to active false
      await paletteModel.updateMany(
        { companyId, active: true },
        {
          active: false,
          updatedBy: userId,
        },
      );
      await logger.info(
        "All other palettes deactivated for new palette creation",
        { companyId },
      );
    }

    const newPalette = await createService(
      paletteModel,
      {
        ...body,
        createdBy: userId,
        companyId,
      },
      companyId,
      role,
    );

    await delCache(`palettes:*${companyId}*`);

    await logger.info("Palette created successfully", {
      id: newPalette._id,
      mode,
      companyId,
    });

    return newPalette;
  },
);

// Get All Palettes
export const getAllPalettesService = asyncHandler(
  async (req, companyId, role) => {
    // Validate company context
    if (role !== "super-admin" && !companyId) {
      throw new ApiError("🛑 Company context is missing", 403);
    }

    const cacheKey = `all:${JSON.stringify(req.query)}:${companyId}`;

    return await cacheWrapper(
      cacheKey,
      async () => {
        const result = await getAllService(
          paletteModel,
          req.query,
          "palette",
          companyId,
          {}, // filter
          {}, // options
          role,
        );

        await logger.info("Fetched all palettes", { companyId });

        return {
          results: result.results,
          data: result.data,
          paginationResult: result.paginationResult,
        };
      },
      undefined,
      { namespace: "palettes" },
    );
  },
);

// Get Palette By ID
export const getPaletteByIdService = asyncHandler(
  async (id, companyId, role) => {
    // Validate company context
    if (role !== "super-admin" && !companyId) {
      throw new ApiError("🛑 Company context is missing", 403);
    }

    return await cacheWrapper(
      `id:${id}:${companyId}`,
      async () => {
        const palette = await getSpecificService(
          paletteModel,
          id,
          companyId,
          {},
          role,
        );

        if (!palette) {
          await logger.error("Palette not found", { id, companyId });
          throw new ApiError("🛑 Palette not found in your company", 404);
        }

        await logger.info("Fetched palette", { id, companyId });
        return palette;
      },
      undefined,
      { namespace: "palettes" },
    );
  },
);

// Update Palette
export const updatePaletteService = asyncHandler(
  async (id, body, userId, companyId, role) => {
    // Validate company context
    if (role !== "super-admin" && !companyId) {
      throw new ApiError("🛑 Company context is missing", 403);
    }

    const palette = await paletteModel.findOne({ _id: id, companyId });
    if (!palette) {
      await logger.error("Palette not found", { id, companyId });
      throw new ApiError(
        `🛑 Cannot update. No palette found with ID: ${id} in your company`,
        404,
      );
    }

    // Check if updating active field to true
    if (body.active === true) {
      // Set all other palettes in the same company to active false
      await paletteModel.updateMany(
        { _id: { $ne: id }, companyId, active: true },
        {
          active: false,
          updatedBy: userId,
        },
      );
      await logger.info("All other palettes deactivated", {
        activatedPalette: id,
        companyId,
      });
    }

    const updatedPalette = await updateService(
      paletteModel,
      id,
      {
        ...body,
        updatedBy: userId,
      },
      companyId,
      role,
    );

    await delCache(`palettes:*${companyId}*`);

    await logger.info("Palette updated successfully", { id, companyId });
    return updatedPalette;
  },
);

// Delete Palette
export const deletePaletteService = asyncHandler(
  async (id, companyId, role) => {
    // Validate company context
    if (role !== "super-admin" && !companyId) {
      throw new ApiError("🛑 Company context is missing", 403);
    }

    const palette = await paletteModel.findOne({ _id: id, companyId });
    if (!palette) {
      await logger.error("Palette not found", { id, companyId });
      throw new ApiError("🛑 Palette not found in your company", 404);
    }

    await deleteService(paletteModel, id, companyId, role);

    await delCache(`palettes:*${companyId}*`);

    await logger.info("Palette deleted successfully", { id, companyId });
    return;
  },
);
