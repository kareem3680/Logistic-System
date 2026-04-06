import admin from "./firebase.js";
import asyncHandler from "express-async-handler";
import APIError from "./apiError.js";

// ============================================================
// 🔹 Send FCM Message
// ============================================================
const sendFCM = asyncHandler(async (token, title, body, data = {}) => {
  if (!token) throw new APIError("FCM token is required", 400);

  const message = {
    token,

    notification: {
      title,
      body,
    },

    // Android config
    android: {
      notification: {
        sound: "default",
      },
    },

    // iOS config (APNs)
    apns: {
      payload: {
        aps: {
          sound: "default",
        },
      },
    },

    data,
  };

  try {
    const response = await admin.messaging().send(message);
    return { success: true, messageId: response };
  } catch (err) {
    throw new APIError(`FCM send failed: ${err.message}`, 500);
  }
});

export default sendFCM;
