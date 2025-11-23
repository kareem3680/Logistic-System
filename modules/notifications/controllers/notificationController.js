import asyncHandler from "express-async-handler";

import {
  createNotificationService,
  createAndSendNotificationService,
  getNotificationsService,
  markAsReadService,
  markAllAsReadService,
} from "../services/notificationService.js";

export const createNotification = asyncHandler(async (req, res) => {
  const notification = await createNotificationService(req.body);
  res.status(201).json({
    message: "✅ Notification created successfully",
    data: notification,
  });
});

export const createAndSendNotification = asyncHandler(async (req, res) => {
  const notification = await createAndSendNotificationService(req.body);
  res.status(201).json({
    message: "✅ Notification sent successfully",
    data: notification,
  });
});

export const getNotifications = asyncHandler(async (req, res) => {
  const result = await getNotificationsService(req.query, req.user);

  const message =
    req.user.role === "admin"
      ? "✅ All notifications fetched successfully"
      : "✅ Your notifications fetched successfully";

  res.status(200).json({
    message,
    ...result,
  });
});

export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await markAsReadService(
    req.params.id,
    req.user._id,
    req.user.role
  );
  res.status(200).json({
    message: "✅ Notification marked as read",
    data: notification,
  });
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await markAllAsReadService(req.user._id, req.user.role);
  res.status(200).json({
    message: `✅ ${result.modifiedCount} notifications marked as read`,
    data: result,
  });
});
