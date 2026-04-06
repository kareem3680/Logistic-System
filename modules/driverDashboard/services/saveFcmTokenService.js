import asyncHandler from "express-async-handler";
import userModel from "../../identity/models/userModel.js";
import Logger from "../../../utils/loggerService.js";

const logger = new Logger("FCM");

export const saveFcmTokenService = asyncHandler(async (userId, fcmToken) => {
  const user = await userModel.findByIdAndUpdate(
    userId,
    { $addToSet: { fcmTokens: fcmToken } },
    { new: true },
  );
  logger.info(`FCM token saved for user ${userId}`);

  return user;
});
