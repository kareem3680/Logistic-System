import asyncHandler from "express-async-handler";
import Presence from "../models/presenceModel.js";
import userModel from "../../identity/models/userModel.js";
import Logger from "../../../utils/loggerService.js";
import ApiError from "../../../utils/apiError.js";

const logger = new Logger("presence");

export const setUserOnlineService = asyncHandler(async (userId, socketId) => {
  const user = await userModel.findById(userId);
  if (!user) throw new ApiError("User not found", 404);

  const presence = await Presence.findOneAndUpdate(
    { userId },
    { online: true, socketId, lastSeen: null },
    { upsert: true, new: true }
  );

  await logger.info("User set online", { userId, socketId });
  return presence;
});

export const setUserOfflineService = asyncHandler(async (userId) => {
  const user = await userModel.findById(userId);
  if (!user) throw new ApiError("User not found", 404);

  const presence = await Presence.findOneAndUpdate(
    { userId },
    { online: false, socketId: null, lastSeen: new Date() },
    { new: true }
  );

  await logger.info("User set offline", { userId });
  return presence;
});

export const getUserPresenceService = asyncHandler(async (userId) => {
  const presence = await Presence.findOne({ userId });
  if (!presence) return { online: false, lastSeen: null };

  await logger.info("Fetched user presence", { userId });
  return presence;
});
