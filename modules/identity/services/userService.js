import asyncHandler from "express-async-handler";

import userModel from "../models/userModel.js";
import ApiError from "../../../utils/apiError.js";
import { sanitizeUser } from "../../../utils/sanitizeData.js";
import Logger from "../../../utils/loggerService.js";
const logger = new Logger("user");

export const getMyDataService = asyncHandler(async (userId) => {
  const user = await userModel.findById(userId);
  if (!user) {
    await logger.error("User not found", { userId });
    throw new ApiError(`🛑 No user found with ID: ${userId}`, 404);
  }

  await logger.info("Fetched user data", { userId });
  return sanitizeUser(user);
});

export const updateMyDataService = asyncHandler(async (userId, updateData) => {
  const { name, email, phone } = updateData;

  if (email) {
    const existingEmail = await userModel.findOne({
      email,
      _id: { $ne: userId },
    });
    if (existingEmail) {
      await logger.error("Email already exists", { email });
      throw new ApiError("🛑 This email is already in use.", 400);
    }
  }

  const updateFields = { name, phone, email };

  const user = await userModel.findByIdAndUpdate(userId, updateFields, {
    new: true,
  });

  if (!user) {
    await logger.error("User to update not found", { userId });
    throw new ApiError(`🛑 No user found with ID: ${userId}`, 404);
  }

  await logger.info("Updated user data", { userId });
  return sanitizeUser(user);
});
