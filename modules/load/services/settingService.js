import asyncHandler from "express-async-handler";

import settingModel from "../models/settingModel.js";
import ApiError from "../../../utils/apiError.js";
import { sanitizeSetting } from "../../../utils/sanitizeData.js";
import Logger from "../../../utils/loggerService.js";
import { cacheWrapper, delCache } from "../../../utils/cache.js";

const logger = new Logger("setting");

// This service is used internally by other modules
export const useSettingsService = asyncHandler(async (key, companyId, role) => {
  // Validate company context
  if (role !== "super-admin" && !companyId) {
    throw new ApiError("🛑 Company context is missing", 403);
  }

  const query = { key };
  if (role !== "super-admin") {
    query.companyId = companyId;
  }

  const setting = await settingModel.findOne(query);
  if (!setting) {
    await logger.error("Setting not found", { key, companyId });
    throw new ApiError(`🛑 Setting not found for key: ${key}`, 404);
  }
  return setting.value;
});

export const getSettingsService = asyncHandler(async (companyId, role) => {
  // Validate company context
  if (role !== "super-admin" && !companyId) {
    throw new ApiError("🛑 Company context is missing", 403);
  }

  const cacheKey = `settings:all:${companyId}`;

  return await cacheWrapper(
    cacheKey,
    async () => {
      const query = {};
      if (role !== "super-admin") {
        query.companyId = companyId;
      }

      const settings = await settingModel.find(query);

      if (!settings.length) {
        await logger.error("No settings found", { companyId });
        throw new ApiError("🛑 No settings found", 404);
      }

      await logger.info("Fetched all settings", { companyId });
      return settings.map(sanitizeSetting);
    },
    undefined,
    { namespace: "settings" },
  );
});

export const createSettingService = asyncHandler(
  async (body, companyId, role) => {
    // Validate company context
    if (role !== "super-admin" && !companyId) {
      throw new ApiError("🛑 Company context is missing", 403);
    }

    // Check if key exists for this company
    const query = { key: body.key };
    if (role !== "super-admin") {
      query.companyId = companyId;
    }

    const exists = await settingModel.findOne(query);
    if (exists) {
      await logger.error("Setting key already exists", {
        key: body.key,
        companyId,
      });
      throw new ApiError("🛑 Setting key already exists for your company", 400);
    }

    const setting = await settingModel.create({
      ...body,
      ...(role !== "super-admin" ? { companyId } : {}),
    });

    await delCache(`settings:*${companyId}*`);
    await logger.info("Setting created", { id: setting._id, companyId });

    return sanitizeSetting(setting);
  },
);

export const updateSettingService = asyncHandler(
  async (id, value, companyId, role) => {
    // Validate company context
    if (role !== "super-admin" && !companyId) {
      throw new ApiError("🛑 Company context is missing", 403);
    }

    const query = { _id: id };
    if (role !== "super-admin") {
      query.companyId = companyId;
    }

    const setting = await settingModel.findOneAndUpdate(
      query,
      { value },
      { new: true, runValidators: true },
    );

    if (!setting) {
      await logger.error("Setting to update not found", { id, companyId });
      throw new ApiError(
        `🛑 No setting found for ID: ${id} in your company`,
        404,
      );
    }

    await delCache(`settings:*${companyId}*`);
    await logger.info("Setting updated", { id, companyId });

    return sanitizeSetting(setting);
  },
);
