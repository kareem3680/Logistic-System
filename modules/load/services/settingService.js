import asyncHandler from "express-async-handler";

import settingModel from "../models/settingModel.js";
import ApiError from "../../../utils/apiError.js";
import { sanitizeSetting } from "../../../utils/sanitizeData.js";
import Logger from "../../../utils/loggerService.js";
const logger = new Logger("setting");

export const useSettingsService = asyncHandler(async (key) => {
  const setting = await settingModel.findOne({ key });
  if (!setting) {
    await logger.error("Setting not found", { key });
    throw new ApiError(`🛑 Setting not found for key: ${key}`, 404);
  }
  return setting.value;
});

export const getSettingsService = asyncHandler(async () => {
  const settings = await settingModel.find();
  if (!settings.length) {
    await logger.error("No settings found");
    throw new ApiError("🛑 No settings found", 404);
  }
  await logger.info("Fetched all settings");
  return settings.map(sanitizeSetting);
});

export const createSettingService = asyncHandler(async (body) => {
  const exists = await settingModel.findOne({ key: body.key });
  if (exists) {
    await logger.error("Setting key already exists", { key: body.key });
    throw new ApiError("🛑 Setting key already exists", 400);
  }

  const setting = await settingModel.create(body);
  await logger.info("Setting created", { id: setting._id });
  return sanitizeSetting(setting);
});

export const updateSettingService = asyncHandler(async (id, value) => {
  const setting = await settingModel.findByIdAndUpdate(
    id,
    { value },
    { new: true, runValidators: true }
  );
  if (!setting) {
    await logger.error("Setting to update not found", { id });
    throw new ApiError(`🛑 No setting found for ID: ${id}`, 404);
  }

  await logger.info("Setting updated", { id });
  return sanitizeSetting(setting);
});
