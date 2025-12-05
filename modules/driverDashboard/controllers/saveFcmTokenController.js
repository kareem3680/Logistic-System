import asyncHandler from "express-async-handler";
import { saveFcmTokenService } from "../services/saveFcmTokenService.js";
import ApiError from "../../../utils/apiError.js";

export const saveFcmToken = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { fcmToken } = req.body;

  if (!fcmToken) {
    return next(new ApiError("FCM token is required", 400));
  }

  const user = await saveFcmTokenService(userId, fcmToken);

  res.status(200).json({
    status: "success",
    message: "FCM token saved successfully",
    data: { userId: user._id, fcmTokens: user.fcmTokens },
  });
});
