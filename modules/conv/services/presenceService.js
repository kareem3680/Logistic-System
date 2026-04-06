import asyncHandler from "express-async-handler";
import Presence from "../models/presenceModel.js";
import userModel from "../../identity/models/userModel.js";
import Logger from "../../../utils/loggerService.js";
import ApiError from "../../../utils/apiError.js";

const logger = new Logger("presence");

/**
 * Set user online
 */
export const setUserOnlineService = asyncHandler(async (userId) => {
  const user = await userModel.findById(userId);
  if (!user) throw new ApiError("User not found", 404);

  const presence = await Presence.findOneAndUpdate(
    { userId },
    {
      online: true,
      lastSeen: null,
    },
    { upsert: true }
  );

  await logger.info("User set online", { userId });
  return presence;
});

/**
 * Set user offline
 */
export const setUserOfflineService = asyncHandler(async (userId) => {
  const user = await userModel.findById(userId);
  if (!user) throw new ApiError("User not found", 404);

  const presence = await Presence.findOneAndUpdate(
    { userId },
    {
      online: false,
      lastSeen: new Date(),
    }
  );

  await logger.info("User set offline", { userId });
  return presence;
});

/**
 * Get user presence
 */
export const getUserPresenceService = asyncHandler(async (userId) => {
  const presence = await Presence.findOne({ userId }).lean();
  if (!presence) return { online: false, lastSeen: null };

  return presence;
});
