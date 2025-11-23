import asyncHandler from "express-async-handler";
import userModel from "../../identity/models/userModel.js";

export const saveFcmTokenService = asyncHandler(async (userId, fcmToken) => {
  const user = await userModel.findByIdAndUpdate(
    userId,
    { $addToSet: { fcmTokens: fcmToken } },
    { new: true }
  );

  return user;
});
