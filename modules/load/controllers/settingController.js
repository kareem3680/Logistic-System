import asyncHandler from "express-async-handler";

import {
  createSettingService,
  updateSettingService,
  getSettingsService,
} from "../services/settingService.js";

export const getSettings = asyncHandler(async (req, res) => {
  const settings = await getSettingsService(req.companyId, req.user.role);

  res.status(200).json({
    message: "Settings fetched successfully",
    data: settings,
  });
});

export const createSetting = asyncHandler(async (req, res) => {
  const setting = await createSettingService(
    req.body,
    req.companyId,
    req.user.role,
  );

  res.status(201).json({
    message: "Setting created successfully",
    data: setting,
  });
});

export const updateSetting = asyncHandler(async (req, res) => {
  const updatedSetting = await updateSettingService(
    req.params.id,
    req.body.value,
    req.companyId,
    req.user.role,
  );

  res.status(200).json({
    message: "Setting updated successfully",
    data: updatedSetting,
  });
});
