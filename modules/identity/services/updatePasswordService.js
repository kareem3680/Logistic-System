import asyncHandler from "express-async-handler";
import { compare } from "bcryptjs";

import userModel from "../models/userModel.js";
import ApiError from "../../../utils/apiError.js";
import createToken from "../../../utils/createToken.js";
import { sanitizeUser } from "../../../utils/sanitizeData.js";
import Logger from "../../../utils/loggerService.js";
const logger = new Logger("update-password");

export const updateMyPasswordService = asyncHandler(
  async (userId, currentPassword, newPassword) => {
    const user = await userModel.findById(userId);
    if (!user) {
      await logger.error("User not found", { userId });
      throw new ApiError(
        "🛑 Current or new password is invalid. Please check and try again.",
        400
      );
    }

    const isMatch = await compare(currentPassword, user.password);
    if (!isMatch) {
      await logger.error("Incorrect current password", { userId });
      throw new ApiError(
        "🛑 Current or new password is invalid. Please check and try again.",
        400
      );
    }

    user.password = newPassword;
    user.changedPasswordAt = Date.now();
    await user.save();

    const token = createToken(user._id);

    await logger.info("Password updated successfully", { userId: user._id });

    return {
      user: sanitizeUser(user),
      token,
    };
  }
);
