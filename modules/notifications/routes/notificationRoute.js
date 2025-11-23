import { Router } from "express";
const router = Router();

import {
  protect,
  allowedTo,
} from "../../identity/controllers/authController.js";
import {
  getNotifications,
  createNotification,
  createAndSendNotification,
  markAsRead,
  markAllAsRead,
} from "../controllers/notificationController.js";
import {
  createNotificationValidator,
  getNotificationValidator,
} from "../validators/notificationValidator.js";

router.use(protect);

router
  .route("/")
  .get(getNotifications)
  .post(allowedTo("admin"), createNotificationValidator, createNotification);

router.post(
  "/send",
  allowedTo("admin"),
  createNotificationValidator,
  createAndSendNotification
);

router.patch("/mark/:id", getNotificationValidator, markAsRead);

router.patch("/mark-all", markAllAsRead);

export default router;
