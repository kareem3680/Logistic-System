import asyncHandler from "express-async-handler";
import sendFCM from "../../../utils/fcm.js";

import userModel from "../../identity/models/userModel.js";
import notificationModel from "../models/notificationModel.js";
import ApiError from "../../../utils/apiError.js";
import { sanitizeNotification } from "../../../utils/sanitizeData.js";
import { getIo } from "../../../config/socket.js";
import {
  createService,
  getAllService,
} from "../../../utils/servicesHandler.js";
import Logger from "../../../utils/loggerService.js";

const logger = new Logger("notification");

/* ----------------------------------------------------------------------------
 * Create Notification Only
 * --------------------------------------------------------------------------*/

export const createNotificationService = asyncHandler(async (body) => {
  const { toUser } = body;

  // Validate users exist if array provided
  if (Array.isArray(toUser) && toUser.length > 0) {
    const usersExist = await userModel.find({ _id: { $in: toUser } });

    if (usersExist.length !== toUser.length) {
      throw new ApiError("🛑 One or more users not found", 404);
    }
  }

  const notification = await createService(notificationModel, body);

  await logger.info("Notification created", { id: notification._id });

  return sanitizeNotification(notification);
});

/* ----------------------------------------------------------------------------
 * Create + Send Notification (Socket + FCM)
 * --------------------------------------------------------------------------*/

export const createAndSendNotificationService = asyncHandler(async (body) => {
  const { toUser, toRole, title, message } = body;

  // 1️⃣ Save notification in DB
  const notification = await createService(notificationModel, body);
  const io = getIo();

  // Track count for logging
  let socketSentUsers = new Set();
  let totalFcmSuccess = 0;
  let totalFcmFailed = 0;

  /* ----------------------------------------------------------------------
   * 🔵 Emit to Users via Socket.io (toUser array)
   * --------------------------------------------------------------------*/
  if (Array.isArray(toUser) && toUser.length > 0) {
    toUser.forEach((id) => {
      io.to(`user_${id}`).emit(
        "newNotification",
        sanitizeNotification(notification)
      );
      socketSentUsers.add(id.toString());
    });
  }

  /* ----------------------------------------------------------------------
   * 🔵 Emit to Roles via Socket.io (toRole array)
   * --------------------------------------------------------------------*/
  if (Array.isArray(toRole) && toRole.length > 0) {
    const users = await userModel.find({ role: { $in: toRole } }, "_id");

    users.forEach((u) => {
      io.to(`user_${u._id}`).emit(
        "newNotification",
        sanitizeNotification(notification)
      );
      socketSentUsers.add(u._id.toString());
    });
  }

  /* ----------------------------------------------------------------------
   * 🔵 Send FCM to individual users (toUser array)
   * --------------------------------------------------------------------*/
  if (Array.isArray(toUser) && toUser.length > 0) {
    const users = await userModel.find({
      _id: { $in: toUser },
      fcmTokens: { $exists: true, $ne: [] },
    });

    for (const user of users) {
      for (const token of user.fcmTokens) {
        try {
          await sendFCM(token, title, message, {
            notificationId: notification._id.toString(),
          });
          totalFcmSuccess++;
        } catch (err) {
          totalFcmFailed++;
          console.error(
            `⚠️ FCM failed for user ${user._id} | Token: ${token} | ${err.message}`
          );

          await userModel.updateOne(
            { _id: user._id },
            { $pull: { fcmTokens: token } }
          );
        }
      }
    }
  }

  /* ----------------------------------------------------------------------
   * 🔵 Send FCM to role-based users (toRole array)
   * --------------------------------------------------------------------*/
  if (Array.isArray(toRole) && toRole.length > 0) {
    const users = await userModel.find({
      role: { $in: toRole },
      fcmTokens: { $exists: true, $ne: [] },
    });

    for (const user of users) {
      for (const token of user.fcmTokens) {
        try {
          await sendFCM(token, title, message, {
            notificationId: notification._id.toString(),
          });
          totalFcmSuccess++;
        } catch (err) {
          totalFcmFailed++;
          console.error(
            `⚠️ FCM failed for user ${user._id} | Token: ${token} | ${err.message}`
          );

          await userModel.updateOne(
            { _id: user._id },
            { $pull: { fcmTokens: token } }
          );
        }
      }
    }
  }

  /* ----------------------------------------------------------------------
   * Logging
   * --------------------------------------------------------------------*/
  await logger.info("Notification created and sent", {
    totalSocketSent: socketSentUsers.size,
    totalFcmSuccess,
    totalFcmFailed,
  });

  return sanitizeNotification(notification);
});

/* ----------------------------------------------------------------------------
 * Fetch Notifications
 * --------------------------------------------------------------------------*/

export const getNotificationsService = asyncHandler(
  async (query, user = null) => {
    let filter = {};

    if (user) {
      filter = {
        $or: [
          { toUser: { $in: [user._id] } },
          { toRole: { $in: [user.role] } },
        ],
      };
    }

    const result = await getAllService(
      notificationModel,
      query,
      "notification",
      filter,
      {
        populate: [{ path: "toUser", select: "name jobId" }],
      }
    );

    await logger.info("Fetched notifications", {
      userId: user?._id,
      userRole: user?.role,
    });

    return {
      ...result,
      data: result.data.map(sanitizeNotification),
    };
  }
);

/* ----------------------------------------------------------------------------
 * Mark as Read
 * --------------------------------------------------------------------------*/

export const markAsReadService = asyncHandler(async (id, userId, userRole) => {
  const notification = await notificationModel.findOne({
    _id: id,
    $or: [{ toUser: { $in: [userId] } }, { toRole: { $in: [userRole] } }],
  });

  if (!notification) {
    throw new ApiError(
      "🛑 Notification not found or you don't have permission",
      404
    );
  }

  const updatedNotification = await notificationModel.findByIdAndUpdate(
    id,
    { status: "read" },
    { new: true }
  );

  await logger.info("Marked notification as read", {
    id,
    userId,
    userRole,
  });

  return sanitizeNotification(updatedNotification);
});

/* ----------------------------------------------------------------------------
 * Mark All as Read
 * --------------------------------------------------------------------------*/

export const markAllAsReadService = asyncHandler(async (userId, userRole) => {
  const result = await notificationModel.updateMany(
    {
      status: "unread",
      $or: [{ toUser: { $in: [userId] } }, { toRole: { $in: [userRole] } }],
    },
    { status: "read" }
  );

  await logger.info("Marked all notifications as read", {
    userId,
    userRole,
    modifiedCount: result.modifiedCount,
  });

  return {
    success: true,
    modifiedCount: result.modifiedCount,
  };
});
