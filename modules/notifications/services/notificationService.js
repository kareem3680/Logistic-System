import asyncHandler from "express-async-handler";
import sendFCM from "../../../utils/fcm.js";

import userModel from "../../identity/models/userModel.js";
import notificationModel from "../models/notificationModel.js";
import ApiError from "../../../utils/apiError.js";
import { sanitizeNotification } from "../../../utils/sanitizeData.js";
import { getIo } from "../../../io/index.js";
import {
  createService,
  getAllService,
} from "../../../utils/servicesHandler.js";
import Logger from "../../../utils/loggerService.js";

const logger = new Logger("notification");

/* ----------------------------------------------------------------------------
 * Create Notification Only
 * --------------------------------------------------------------------------*/

export const createNotificationService = asyncHandler(
  async (body, companyId, role) => {
    const { toUser } = body;

    // Validate users exist if array provided and belong to same company
    if (Array.isArray(toUser) && toUser.length > 0) {
      const usersExist = await userModel.find({
        _id: { $in: toUser },
        ...(role !== "super-admin" ? { companyId } : {}),
      });

      if (usersExist.length !== toUser.length) {
        throw new ApiError(
          "🛑 One or more users not found or not in your company",
          404,
        );
      }
    }

    const notification = await createService(
      notificationModel,
      body,
      companyId,
      role,
    );

    await logger.info("Notification created", {
      id: notification._id,
      companyId,
    });

    return sanitizeNotification(notification);
  },
);

/* ----------------------------------------------------------------------------
 * Create + Send Notification (Socket + FCM)
 * --------------------------------------------------------------------------*/

export const createAndSendNotificationService = asyncHandler(
  async (body, userId, companyId, role) => {
    const { toUser, toRole, title, message } = body;

    // 1️⃣ Save notification in DB with company context
    const notification = await createService(
      notificationModel,
      {
        ...body,
        from: userId,
      },
      companyId,
      role,
    );

    const io = getIo();

    // Track count for logging
    let socketSentUsers = new Set();
    let totalFcmSuccess = 0;
    let totalFcmFailed = 0;

    /* ----------------------------------------------------------------------
     * 🔵 Emit to Users via Socket.io (toUser array)
     * --------------------------------------------------------------------*/
    if (Array.isArray(toUser) && toUser.length > 0) {
      // Get only users from same company
      const users = await userModel.find({
        _id: { $in: toUser },
        ...(role !== "super-admin" ? { companyId } : {}),
        active: true,
      });

      users.forEach((user) => {
        io.to(`user_${user._id}`).emit(
          "newNotification",
          sanitizeNotification(notification),
        );
        socketSentUsers.add(user._id.toString());
      });
    }

    /* ----------------------------------------------------------------------
     * 🔵 Emit to Roles via Socket.io (toRole array)
     * --------------------------------------------------------------------*/
    if (Array.isArray(toRole) && toRole.length > 0) {
      const users = await userModel.find(
        {
          role: { $in: toRole },
          ...(role !== "super-admin" ? { companyId } : {}),
          active: true,
        },
        "_id",
      );

      users.forEach((u) => {
        io.to(`user_${u._id}`).emit(
          "newNotification",
          sanitizeNotification(notification),
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
        ...(role !== "super-admin" ? { companyId } : {}),
        fcmTokens: { $exists: true, $ne: [] },
        active: true,
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
              `⚠️ FCM failed for user ${user._id} | Token: ${token} | ${err.message}`,
            );

            await userModel.updateOne(
              { _id: user._id },
              { $pull: { fcmTokens: token } },
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
        ...(role !== "super-admin" ? { companyId } : {}),
        fcmTokens: { $exists: true, $ne: [] },
        active: true,
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
              `⚠️ FCM failed for user ${user._id} | Token: ${token} | ${err.message}`,
            );

            await userModel.updateOne(
              { _id: user._id },
              { $pull: { fcmTokens: token } },
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
      companyId,
    });

    return sanitizeNotification(notification);
  },
);

/* ----------------------------------------------------------------------------
 * Fetch Notifications
 * --------------------------------------------------------------------------*/

export const getNotificationsService = asyncHandler(
  async (query, user = null, companyId, role) => {
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
      companyId,
      filter,
      {
        populate: [
          { path: "toUser", select: "name jobId" },
          { path: "from", select: "name jobId" },
        ],
      },
      role,
    );

    await logger.info("Fetched notifications", {
      userId: user?._id,
      userRole: user?.role,
      companyId,
    });

    return {
      ...result,
      data: result.data.map(sanitizeNotification),
    };
  },
);

/* ----------------------------------------------------------------------------
 * Mark as Read
 * --------------------------------------------------------------------------*/

export const markAsReadService = asyncHandler(
  async (id, userId, userRole, companyId, role) => {
    // Validate company context manually since we need custom query
    if (role !== "super-admin" && !companyId) {
      throw new ApiError("🛑 Company context is missing", 403);
    }

    const query = {
      _id: id,
      $or: [{ toUser: { $in: [userId] } }, { toRole: { $in: [userRole] } }],
    };

    // Add companyId to query if not super-admin
    if (role !== "super-admin") {
      query.companyId = companyId;
    }

    const notification = await notificationModel.findOne(query);

    if (!notification) {
      throw new ApiError(
        "🛑 Notification not found or you don't have permission",
        404,
      );
    }

    const updatedNotification = await notificationModel.findByIdAndUpdate(
      id,
      { status: "read" },
      { new: true },
    );

    await logger.info("Marked notification as read", {
      id,
      userId,
      userRole,
      companyId,
    });

    return sanitizeNotification(updatedNotification);
  },
);

/* ----------------------------------------------------------------------------
 * Mark All as Read
 * --------------------------------------------------------------------------*/

export const markAllAsReadService = asyncHandler(
  async (userId, userRole, companyId, role) => {
    // Validate company context manually
    if (role !== "super-admin" && !companyId) {
      throw new ApiError("🛑 Company context is missing", 403);
    }

    const filter = {
      status: "unread",
      $or: [{ toUser: { $in: [userId] } }, { toRole: { $in: [userRole] } }],
    };

    // Add companyId to filter if not super-admin
    if (role !== "super-admin") {
      filter.companyId = companyId;
    }

    const result = await notificationModel.updateMany(filter, {
      status: "read",
    });

    await logger.info("Marked all notifications as read", {
      userId,
      userRole,
      companyId,
      modifiedCount: result.modifiedCount,
    });

    return {
      success: true,
      modifiedCount: result.modifiedCount,
    };
  },
);
